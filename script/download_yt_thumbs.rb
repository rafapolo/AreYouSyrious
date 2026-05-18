#!/usr/bin/env ruby
# Downloads YouTube thumbnails for standalone video links in posts/
# and converts them to image-embedded links:
#   [title](yt_url) → [![title](../assets/post_id/vid_hqdefault.jpg)](yt_url)
#
# Only processes lines where the YouTube link is the full/dominant content
# (standalone on their own line). Inline sentence references are left alone.
#
# Usage: ruby download_yt_thumbs.rb

require "net/http"
require "uri"
require "fileutils"

REPO_ROOT  = File.expand_path("..", __dir__)
POSTS_DIR  = File.join(REPO_ROOT, "posts")
ASSETS_DIR = File.join(REPO_ROOT, "assets")
YT_THUMB   = "https://img.youtube.com/vi/%s/hqdefault.jpg"
UA         = "Mozilla/5.0 (compatible; AYS-archiver/1.0)"

# Regex to extract video ID from youtube or youtu.be URLs
YT_ID_RE = /(?:youtube\.com\/watch[?&](?:[^&")\s]+&)*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/

# A "standalone" line: trimmed content is entirely (or mostly) one markdown link
# i.e. [anything](url) possibly prefixed with "> " or "video: "
STANDALONE_RE = /\A(?:>?\s*(?:video:\s*)?)\[([^\]]*)\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch[?][^\s)"]+|youtu\.be\/[a-zA-Z0-9_-]{11}[^\s)"]*?))\)\s*\z/i

def fetch_bytes(url, timeout: 20)
  uri = URI.parse(url)
  Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https",
                  open_timeout: 10, read_timeout: timeout) do |http|
    req = Net::HTTP::Get.new(uri)
    req["User-Agent"] = UA
    res = http.request(req)
    res.code.to_i == 200 ? res.body : nil
  end
rescue
  nil
end

stats = { converted: 0, skipped_exists: 0, failed: 0, files_changed: 0 }

all_posts = Dir.glob(File.join(POSTS_DIR, "*.md")).sort
puts "Scanning #{all_posts.count} posts for standalone YouTube links...\n\n"

all_posts.each do |post_path|
  basename = File.basename(post_path, ".md")
  post_id  = basename[/[a-f0-9]{8,}$/]
  next unless post_id

  content  = File.read(post_path, encoding: "utf-8")
  lines    = content.lines
  modified = false

  lines.map! do |line|
    m = STANDALONE_RE.match(line.chomp)
    next line unless m

    title  = m[1]
    yt_url = m[2]
    vid_m  = YT_ID_RE.match(yt_url)
    next line unless vid_m

    vid_id   = vid_m[1]
    filename = "#{vid_id}_hqdefault.jpg"
    dest_dir = File.join(ASSETS_DIR, post_id)
    dest     = File.join(dest_dir, filename)
    local    = "../assets/#{post_id}/#{filename}"

    # Indent/prefix ("> " etc.) preserved
    prefix = line[/\A(?:>?\s*(?:video:\s*)?)/]

    unless File.exist?(dest)
      print "  ↓ #{vid_id} (#{title[0, 50]})... "
      data = fetch_bytes(YT_THUMB % vid_id)
      if data
        FileUtils.mkdir_p(dest_dir)
        File.binwrite(dest, data)
        stats[:converted] += 1
        print "✓\n"
      else
        stats[:failed] += 1
        print "✗\n"
        next line
      end
    else
      stats[:skipped_exists] += 1
    end

    modified = true
    # Build image-embed link, preserving the title
    "#{prefix}[![#{title}](#{local})](#{yt_url})\n"
  end

  if modified
    File.write(post_path, lines.join, encoding: "utf-8")
    stats[:files_changed] += 1
  end
end

puts "\n#{"=" * 60}"
puts "Thumbnails downloaded : #{stats[:converted]}"
puts "Already existed       : #{stats[:skipped_exists]}"
puts "Failed                : #{stats[:failed]}"
puts "Posts modified        : #{stats[:files_changed]}"
