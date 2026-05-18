#!/usr/bin/env ruby
# Downloads missing posts from AreYouSyrious on Medium one by one.
#
# Reads missing_posts.csv (date,title,url) and downloads each with -p <url>.
# Already-downloaded posts are skipped automatically.
# Run repeatedly until all are fetched — safe to interrupt and resume.
#
# Medium authentication:
#   export MEDIUM_COOKIE_SID=<value>   (or set in .env)
#
# Usage: ruby fetch.rb

require "csv"
require "fileutils"
require "shellwords"

POSTS_DIR  = File.join(__dir__, "posts")
ASSETS_DIR = File.join(__dir__, "assets")
OUTPUT_DIR = File.join(__dir__, "Output", "users", "AreYouSyrious", "zmediumtomarkdown")
CSV_PATH   = File.join(__dir__, "missing_posts.csv")

puts "==> AreYouSyrious — fetch missing posts"
puts ""
%w[MEDIUM_COOKIE_SID MEDIUM_COOKIE_UID MEDIUM_COOKIE_CF_CLEARANCE MEDIUM_COOKIE_CFUVID MEDIUM_HOST].each do |var|
  puts "    #{var}: #{ENV[var] ? "set" : "not set"}"
end
puts ""

# Load missing posts from CSV
rows = CSV.read(CSV_PATH, headers: true)
puts "    #{rows.count} posts in missing_posts.csv"

# Skip already downloaded (match by post ID in filename)
local_ids = Dir.glob(File.join(POSTS_DIR, "*.md")).filter_map do |f|
  File.basename(f, ".md")[/[a-f0-9]{8,}$/]
end.to_set

todo = rows.reject do |row|
  url = row["url"] || ""
  id  = url[/[a-f0-9]{8,}$/]
  id && local_ids.include?(id)
end

puts "    #{local_ids.count} already in repo"
puts "    #{todo.count} still to download\n\n"

if todo.empty?
  puts "All caught up!"
  exit 0
end

FileUtils.mkdir_p(OUTPUT_DIR)
downloaded = 0
failed     = []

todo.each_with_index do |row, i|
  url   = row["url"]
  title = row["title"]
  puts "[#{i + 1}/#{todo.count}] #{row['date']} — #{title[0, 60]}"
  puts "    #{url}"

  success = system("ZMediumToMarkdown", "-p", url)

  if success
    # Move new .md files from anywhere under Output/ → posts/
    Dir.glob(File.join(__dir__, "Output", "**", "*.md")).each do |src|
      dest = File.join(POSTS_DIR, File.basename(src))
      next if File.exist?(dest)
      content = File.read(src)
        .gsub("path: assets/", "path: ../assets/")
        .gsub("](assets/", "](../assets/")
      File.write(dest, content)
      FileUtils.rm(src)
    end

    # Move image folders from anywhere under Output/ → root assets/
    Dir.glob(File.join(__dir__, "Output", "**", "assets", "*")).each do |folder|
      next unless File.directory?(folder)
      dest = File.join(ASSETS_DIR, File.basename(folder))
      FileUtils.mkdir_p(ASSETS_DIR)
      FileUtils.mv(folder, dest) unless Dir.exist?(dest)
    end

    downloaded += 1
    puts "    ✓ done\n\n"
  else
    failed << url
    puts "    ✗ failed (will need retry)\n\n"
  end
end

FileUtils.rm_rf(File.join(__dir__, "Output"))

puts "=" * 60
puts "Downloaded : #{downloaded}"
puts "Failed     : #{failed.count}"
failed.each { |u| puts "  #{u}" }

# Rebuild README
puts "\n==> Rebuilding README.md..."
readme = `ruby #{Shellwords.escape(File.join(__dir__, "index.rb"))}`
File.write(File.join(__dir__, "README.md"), readme)
puts "Done — #{Dir.glob(File.join(POSTS_DIR, '*.md')).count} posts total."
