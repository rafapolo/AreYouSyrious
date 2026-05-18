#!/usr/bin/env ruby
# Downloads all missing posts from AreYouSyrious on Medium, then rebuilds README.md.
#
# Structure maintained:
#   posts/         — markdown files
#   assets/        — images (root level), referenced as ../assets/ from posts/
#
# Already-downloaded posts are skipped automatically (matched by post ID in filename).
# Images are always saved locally — remote URLs are never left in output.
#
# Medium authentication (needed when rate-limited or behind Cloudflare):
#   export MEDIUM_COOKIE_SID=<value>
#   export MEDIUM_COOKIE_UID=<value>
#   export MEDIUM_COOKIE_CF_CLEARANCE=<value>   # optional
#   export MEDIUM_COOKIE_CFUVID=<value>          # optional
#   export MEDIUM_HOST=<cloudflare-worker-url>   # optional, strongly recommended for bulk runs
#
# To capture cookies interactively: ZMediumToMarkdown --auth
#
# Usage: ruby fetch.rb

require "shellwords"
require "fileutils"

PUBLICATION = "AreYouSyrious".freeze
POSTS_DIR   = File.join(__dir__, "posts")
ASSETS_DIR  = File.join(__dir__, "assets")

puts "==> Fetching posts for #{PUBLICATION}"
puts "    posts/   → #{POSTS_DIR}"
puts "    assets/  → #{ASSETS_DIR}"
puts ""

%w[MEDIUM_COOKIE_SID MEDIUM_COOKIE_UID MEDIUM_COOKIE_CF_CLEARANCE MEDIUM_COOKIE_CFUVID MEDIUM_HOST].each do |var|
  puts "    #{var}: #{ENV[var] ? "set" : "not set"}"
end
puts ""

before_posts = Dir.glob(File.join(POSTS_DIR, "*.md"))
puts "    Posts before: #{before_posts.count}"
puts ""

# ZMediumToMarkdown v4 writes to Output/users/<publication>/zmediumtomarkdown/
# relative to the cwd. It skips posts whose filename already exists in that dir.
OUTPUT_DIR = File.join(__dir__, "Output", "users", PUBLICATION, "zmediumtomarkdown")
FileUtils.mkdir_p(OUTPUT_DIR)

# Step 1: Pre-seed Output/ with empty placeholders for every post we already have.
# ZMediumToMarkdown sees these and skips them — only new posts get downloaded.
before_posts.each do |post|
  placeholder = File.join(OUTPUT_DIR, File.basename(post))
  FileUtils.touch(placeholder) unless File.exist?(placeholder)
end
puts "    Seeded #{before_posts.count} placeholders — ZMediumToMarkdown will skip these."
puts ""

# Step 2: Run ZMediumToMarkdown from repo root
unless system("ZMediumToMarkdown", "-u", PUBLICATION)
  abort "\nZMediumToMarkdown failed. If Medium is blocking the request, set auth env vars (see top of this file) or run: ZMediumToMarkdown --auth"
end

# Step 2: Move new .md files from Output/ → posts/
new_posts = []
Dir.glob(File.join(OUTPUT_DIR, "*.md")).each do |src|
  dest = File.join(POSTS_DIR, File.basename(src))
  next if File.exist?(dest)
  FileUtils.mv(src, dest)
  new_posts << dest
end

# Step 3: Move image folders from Output/assets/ → root assets/
output_assets = File.join(OUTPUT_DIR, "assets")
if Dir.exist?(output_assets)
  FileUtils.mkdir_p(ASSETS_DIR)
  Dir.glob(File.join(output_assets, "*")).each do |folder|
    dest = File.join(ASSETS_DIR, File.basename(folder))
    FileUtils.mv(folder, dest) unless Dir.exist?(dest)
  end
end

# Step 4: Fix image paths in new .md files: assets/ → ../assets/
new_posts.each do |post|
  content = File.read(post)
  fixed = content
    .gsub("path: assets/", "path: ../assets/")
    .gsub("](assets/", "](../assets/")
  File.write(post, fixed) if fixed != content
end

# Step 5: Clean up empty Output/ tree
FileUtils.rm_rf(File.join(__dir__, "Output"))

after_posts = Dir.glob(File.join(POSTS_DIR, "*.md"))
puts "\n    +#{new_posts.count} new posts  (#{after_posts.count} total)"

# Step 6: Rebuild README.md index
puts "\n==> Rebuilding README.md..."
readme = `ruby #{Shellwords.escape(File.join(__dir__, "index.rb"))}`
File.write(File.join(__dir__, "README.md"), readme)

puts "    Done — #{after_posts.count} posts indexed."
