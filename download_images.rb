#!/usr/bin/env ruby
# Downloads all remote images referenced in posts/ and replaces their URLs
# with local ../assets/<post-id>/ paths. Idempotent — safe to re-run.
#
# Usage: ruby download_images.rb

require "net/http"
require "uri"
require "fileutils"

POSTS_DIR  = File.join(__dir__, "posts")
ASSETS_DIR = File.join(__dir__, "assets")
MAX_TRIES  = 3
UA         = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"

# Skip these — they are iframe embeds, not downloadable images
SKIP_HOSTS = %w[
  medium.com/media
  youtube.com
  youtu.be
  twitter.com
  x.com
  facebook.com/plugins
  instagram.com
].freeze

stats = { files_changed: 0, downloaded: 0, skipped: 0, failed: 0 }
failures = []

def fetch_with_redirect(url, tries = 0)
  return nil if tries >= MAX_TRIES
  uri = URI.parse(ascii_url(url))
  req = Net::HTTP::Get.new(uri)
  req["User-Agent"] = UA
  req["Referer"]    = "https://medium.com/"

  Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https",
                  open_timeout: 10, read_timeout: 20) do |http|
    res = http.request(req)
    case res.code.to_i
    when 200
      res.body
    when 301, 302, 303, 307, 308
      location = res["location"]
      return nil unless location
      fetch_with_redirect(location, tries + 1)
    else
      nil
    end
  end
rescue => e
  nil
end

def ascii_url(url)
  url.encode("UTF-8").gsub(/[^\x00-\x7F]/) { |c| URI.encode_www_form_component(c) }
end

def safe_filename(url)
  name = File.basename(URI.parse(ascii_url(url)).path).split("?").first
  name = "image" if name.nil? || name.empty?
  name.gsub(/\A\d+\*/, "")
end

all_posts = Dir.glob(File.join(POSTS_DIR, "*.md")).sort
puts "Scanning #{all_posts.count} posts...\n\n"

all_posts.each do |post_path|
  basename = File.basename(post_path, ".md")
  post_id  = basename[/[a-f0-9]{8,}$/]
  next unless post_id

  content  = File.read(post_path, encoding: "utf-8")
  modified = content.dup

  # Find all https:// image URLs in markdown image syntax and YAML path:
  urls = content.scan(/https?:\/\/[^\s)"']+\.(?:jpe?g|png|gif|webp|svg)(?:\?[^\s)"']*)?/i).uniq

  urls.each do |url|
    # Skip embed hosts
    next if SKIP_HOSTS.any? { |h| url.include?(h) }

    filename  = safe_filename(url)
    dest_dir  = File.join(ASSETS_DIR, post_id)
    dest_path = File.join(dest_dir, filename)
    local_ref = "../assets/#{post_id}/#{filename}"

    if File.exist?(dest_path)
      stats[:skipped] += 1
    else
      print "  ↓ #{url[0, 80]}..."
      data = fetch_with_redirect(url)
      if data
        FileUtils.mkdir_p(dest_dir)
        File.binwrite(dest_path, data)
        stats[:downloaded] += 1
        print " ✓\n"
      else
        stats[:failed] += 1
        failures << { post: basename, url: url }
        print " ✗\n"
        next
      end
    end

    # Replace all occurrences of this URL in the file
    modified = modified.gsub(url, local_ref)
  end

  if modified != content
    File.write(post_path, modified, encoding: "utf-8")
    stats[:files_changed] += 1
  end
end

puts "\n#{"=" * 60}"
puts "Done."
puts "  Posts modified : #{stats[:files_changed]}"
puts "  Images downloaded : #{stats[:downloaded]}"
puts "  Already local (skipped) : #{stats[:skipped]}"
puts "  Failed to download : #{stats[:failed]}"

unless failures.empty?
  puts "\nFailed URLs:"
  failures.each { |f| puts "  #{f[:post]}\n    #{f[:url]}" }
end
