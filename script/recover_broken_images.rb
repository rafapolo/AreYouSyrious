#!/usr/bin/env ruby
# Recovers broken images via Wayback Machine CDX API.
# Reads broken_links.csv, skips unrecoverable fbcdn signed-token URLs,
# queries CDX for the rest (parallel threads), downloads snapshots,
# saves to assets/, and patches the posts/ markdown files.
#
# Usage: ruby recover_broken_images.rb

require "net/http"
require "uri"
require "fileutils"
require "csv"
require "json"
require "thread"

REPO_ROOT  = File.expand_path("..", __dir__)
POSTS_DIR  = File.join(REPO_ROOT, "posts")
ASSETS_DIR = File.join(REPO_ROOT, "assets")
CDX_URL    = "https://web.archive.org/cdx/search/cdx"
WB_BASE    = "https://web.archive.org/web"
UA         = "Mozilla/5.0 (compatible; AYS-archiver/1.0)"
THREADS    = 12

# Facebook CDN images use expiring signed tokens — Wayback never crawled them
SKIP_HOSTS = %w[fbcdn.net xx.fbcdn.net].freeze

STDOUT.sync = true

def ascii_url(url)
  url.encode("UTF-8").gsub(/[^\x00-\x7F]/) { |c| URI.encode_www_form_component(c) }
end

def http_get(url, timeout: 60, max_redirects: 5)
  redirects = 0
  loop do
    uri = URI.parse(ascii_url(url))
    res = Net::HTTP.start(uri.host, uri.port,
                          use_ssl: uri.scheme == "https",
                          open_timeout: 20,
                          read_timeout: timeout) do |http|
      req = Net::HTTP::Get.new(uri)
      req["User-Agent"] = UA
      http.request(req)
    end
    case res.code.to_i
    when 200        then return res.body
    when 301, 302, 303, 307, 308
      redirects += 1
      return nil if redirects > max_redirects
      loc = res["location"]
      return nil unless loc
      url = loc.start_with?("http") ? loc : "https://web.archive.org#{loc}"
    else
      return nil
    end
  end
rescue
  nil
end

def cdx_lookup(url)
  query = URI.encode_www_form(
    "url" => url, "output" => "json", "limit" => "5",
    "fl" => "timestamp,statuscode,mimetype",
    "filter" => "statuscode:200", "collapse" => "digest"
  )
  body = http_get("#{CDX_URL}?#{query}", timeout: 90)
  return nil unless body

  rows = JSON.parse(body)
  data = rows.length > 1 ? rows[1..] : []
  return nil if data.empty?

  image_rows = data.select { |r| r[2]&.start_with?("image/") }
  (image_rows.last || data.last)[0]
rescue
  nil
end

def fetch_wayback(timestamp, original_url)
  wb_url = "#{WB_BASE}/#{timestamp}if_/#{original_url}"
  data = http_get(wb_url, timeout: 60)
  return nil if data.nil? || data.b.start_with?("<!D", "<ht", "<!d")
  data
end

def safe_filename(url)
  path = URI.parse(ascii_url(url)).path rescue url
  name = File.basename(path).split("?").first.to_s
  name = "image" if name.empty? || name == "/"
  name.gsub(/\A1\*/, "1_")
rescue
  "image_#{rand(100_000)}"
end

# ── load work items ────────────────────────────────────────────────────────────

broken = CSV.read(File.join(REPO_ROOT, "meta", "broken_links.csv"), headers: true)
puts "Loaded #{broken.count} broken links"

work_items = []
skip_count = 0

broken.each do |row|
  post_file = row["post"]
  url       = row["url"]
  post_id   = post_file.match(/([a-f0-9]{8,})\.md$/i)&.[](1)
  host      = URI.parse(ascii_url(url)).host rescue ""

  if post_id.nil? || SKIP_HOSTS.any? { |s| host.end_with?(s) }
    skip_count += 1
    next
  end

  filename  = safe_filename(url)
  dest_path = File.join(ASSETS_DIR, post_id, filename)
  local_ref = "../assets/#{post_id}/#{filename}"

  work_items << { post_file: post_file, url: url, post_id: post_id,
                  filename: filename, dest_path: dest_path, local_ref: local_ref }
end

puts "Skipped #{skip_count} fbcdn (unrecoverable signed CDN URLs)"
puts "Querying CDX for #{work_items.size} URLs with #{THREADS} threads...\n\n"

# ── parallel CDX + download ────────────────────────────────────────────────────

mutex     = Mutex.new
stats     = { recovered: 0, already_saved: 0, not_found: 0, failed: 0 }
log       = []
queue     = Queue.new
work_items.each { |item| queue << item }
done      = 0
total     = work_items.size

threads = THREADS.times.map do
  Thread.new do
    loop do
      item = queue.pop(true) rescue break

      if File.exist?(item[:dest_path])
        mutex.synchronize do
          stats[:already_saved] += 1
          log << [item[:post_file], item[:url], "already_saved", item[:local_ref], nil]
          done += 1
          print "\r[#{done}/#{total}] already_saved: #{stats[:already_saved]}  recovered: #{stats[:recovered]}  not_found: #{stats[:not_found]}  failed: #{stats[:failed]}  "
        end
        # Still patch markdown below (outside mutex for speed)
      else
        timestamp = cdx_lookup(item[:url])

        unless timestamp
          mutex.synchronize do
            stats[:not_found] += 1
            log << [item[:post_file], item[:url], "not_in_wayback", nil, nil]
            done += 1
            print "\r[#{done}/#{total}] already_saved: #{stats[:already_saved]}  recovered: #{stats[:recovered]}  not_found: #{stats[:not_found]}  failed: #{stats[:failed]}  "
          end
          next
        end

        data = fetch_wayback(timestamp, item[:url])

        unless data
          mutex.synchronize do
            stats[:failed] += 1
            log << [item[:post_file], item[:url], "download_failed", nil, timestamp]
            done += 1
            print "\r[#{done}/#{total}] already_saved: #{stats[:already_saved]}  recovered: #{stats[:recovered]}  not_found: #{stats[:not_found]}  failed: #{stats[:failed]}  "
          end
          next
        end

        dest_dir = File.join(ASSETS_DIR, item[:post_id])
        mutex.synchronize do
          FileUtils.mkdir_p(dest_dir)
          File.binwrite(item[:dest_path], data)
          stats[:recovered] += 1
          log << [item[:post_file], item[:url], "recovered", item[:local_ref], timestamp]
          done += 1
          size_kb = (data.bytesize / 1024.0).round(1)
          print "\r[#{done}/#{total}] already_saved: #{stats[:already_saved]}  recovered: #{stats[:recovered]}  not_found: #{stats[:not_found]}  failed: #{stats[:failed]}  "
          puts "\n  ✓ #{item[:post_id]}/#{item[:filename]} (#{size_kb} KB)"
        end
      end

      # Patch markdown (file I/O outside mutex — each post file written by at most one thread at a time
      # since broken_links groups same-post entries sequentially; worst case: benign double-write)
      post_path = File.join(POSTS_DIR, item[:post_file])
      next unless File.exist?(post_path)

      content = File.read(post_path, encoding: "utf-8")
      next unless content.include?(item[:url])

      mutex.synchronize do
        current = File.read(post_path, encoding: "utf-8")
        if current.include?(item[:url])
          File.write(post_path, current.gsub(item[:url], item[:local_ref]), encoding: "utf-8")
        end
      end
    end
  end
end

threads.each(&:join)

puts "\n\n#{"=" * 60}"
puts "Recovered from Wayback : #{stats[:recovered]}"
puts "Already saved locally  : #{stats[:already_saved]}"
puts "Not in Wayback         : #{stats[:not_found]}"
puts "Download failed        : #{stats[:failed]}"
puts "Skipped fbcdn          : #{skip_count}"

CSV.open(File.join(REPO_ROOT, "meta", "recovery_log.csv"), "w") do |csv|
  csv << %w[post url status local_path wayback_timestamp]
  log.each { |r| csv << r }
end
puts "\nLog saved to meta/recovery_log.csv"
