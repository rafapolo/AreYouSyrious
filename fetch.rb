#!/usr/bin/env ruby
# Downloads only missing posts from AreYouSyrious on Medium.
#
# Strategy:
#   1. Use --list to get every post URL from Medium (no download)
#   2. Extract post IDs from local filenames to know what we already have
#   3. Download only the missing ones with -p <url>
#   4. Move new files into posts/ and assets/
#
# Medium authentication (needed when rate-limited or behind Cloudflare):
#   export MEDIUM_COOKIE_SID=<value>
#   export MEDIUM_COOKIE_UID=<value>
#   export MEDIUM_COOKIE_CF_CLEARANCE=<value>   # optional
#   export MEDIUM_COOKIE_CFUVID=<value>          # optional
#   export MEDIUM_HOST=<cloudflare-worker-url>   # optional, strongly recommended
#
# Usage: ruby fetch.rb

require "json"
require "fileutils"
require "shellwords"

PUBLICATION = "AreYouSyrious".freeze
POSTS_DIR   = File.join(__dir__, "posts")
ASSETS_DIR  = File.join(__dir__, "assets")
OUTPUT_DIR  = File.join(__dir__, "Output", "users", PUBLICATION, "zmediumtomarkdown")

puts "==> Fetching missing posts for #{PUBLICATION}"
puts ""

%w[MEDIUM_COOKIE_SID MEDIUM_COOKIE_UID MEDIUM_COOKIE_CF_CLEARANCE MEDIUM_COOKIE_CFUVID MEDIUM_HOST].each do |var|
  puts "    #{var}: #{ENV[var] ? "set" : "not set"}"
end
puts ""

# Step 1: Get list of all post URLs from Medium (no download)
puts "==> Fetching post list from Medium..."
list_output = `ZMediumToMarkdown --list -u #{Shellwords.escape(PUBLICATION)} 2>/dev/null`
if list_output.empty?
  abort "Failed to fetch post list. Check auth env vars or run: ZMediumToMarkdown --auth"
end

medium_posts = list_output.lines.filter_map do |line|
  JSON.parse(line.strip) rescue nil
end
puts "    #{medium_posts.count} posts found on Medium"

# Step 2: Extract post IDs from local filenames  (last hex segment, e.g. "a1b2c3d4e5f6")
local_ids = Dir.glob(File.join(POSTS_DIR, "*.md")).map do |f|
  File.basename(f, ".md")[/[a-f0-9]{8,}$/]
end.compact.to_set
puts "    #{local_ids.count} posts already in repo"

# Step 3: Find missing posts
missing = medium_posts.reject do |post|
  url = post["url"] || ""
  id  = url[/[a-f0-9]{8,}$/]
  id && local_ids.include?(id)
end
puts "    #{missing.count} posts missing\n\n"

# Step 3b: Save all Medium URLs to CSV (always, whether or not we download)
csv_path = File.join(__dir__, "all_posts_urls.csv")
File.open(csv_path, "w") do |f|
  f.puts "date,title,url"
  medium_posts.each do |post|
    date  = (post["firstPublishedAt"] || "")
    date  = date.is_a?(Integer) ? Time.at(date / 1000).strftime("%Y-%m-%d") : date.to_s[0, 10]
    title = (post["title"] || "").gsub('"', '""')
    url   = post["url"] || ""
    f.puts "#{date},\"#{title}\",#{url}"
  end
end
puts "    Saved all_posts_urls.csv (#{medium_posts.count} rows)\n\n"

if missing.empty?
  puts "Nothing to download — repo is up to date."
  exit 0
end

# Step 4: Download each missing post
FileUtils.mkdir_p(OUTPUT_DIR)
downloaded = 0

missing.each_with_index do |post, i|
  url = post["url"]
  puts "[#{i + 1}/#{missing.count}] #{url}"
  success = system("ZMediumToMarkdown", "-p", url)
  downloaded += 1 if success
end

# Step 5: Move new .md files from Output/ → posts/
new_posts = []
Dir.glob(File.join(OUTPUT_DIR, "*.md")).each do |src|
  dest = File.join(POSTS_DIR, File.basename(src))
  next if File.exist?(dest)
  FileUtils.mv(src, dest)
  new_posts << dest
end

# Step 6: Move image folders from Output/assets/ → root assets/
output_assets = File.join(OUTPUT_DIR, "assets")
if Dir.exist?(output_assets)
  FileUtils.mkdir_p(ASSETS_DIR)
  Dir.glob(File.join(output_assets, "*")).each do |folder|
    dest = File.join(ASSETS_DIR, File.basename(folder))
    FileUtils.mv(folder, dest) unless Dir.exist?(dest)
  end
end

# Step 7: Fix image paths in new .md files: assets/ → ../assets/
new_posts.each do |post|
  content = File.read(post)
  fixed = content
    .gsub("path: assets/", "path: ../assets/")
    .gsub("](assets/", "](../assets/")
  File.write(post, fixed) if fixed != content
end

# Step 8: Clean up Output/
FileUtils.rm_rf(File.join(__dir__, "Output"))

puts "\n    +#{new_posts.count} new posts added"

# Step 9: Rebuild README.md index
puts "\n==> Rebuilding README.md..."
readme = `ruby #{Shellwords.escape(File.join(__dir__, "index.rb"))}`
File.write(File.join(__dir__, "README.md"), readme)

total = Dir.glob(File.join(POSTS_DIR, "*.md")).count
puts "    Done — #{total} posts total."
