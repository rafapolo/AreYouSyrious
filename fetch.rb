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

# Step 1: Run ZMediumToMarkdown from posts/ so it saves .md files there.
# It will also create posts/assets/<id>/ for images — we move those up afterward.
Dir.chdir(POSTS_DIR) do
  unless system("ZMediumToMarkdown", "-u", PUBLICATION)
    abort "\nZMediumToMarkdown failed. If Medium is blocking the request, set auth env vars (see top of this file) or run: ZMediumToMarkdown --auth"
  end
end

# Step 2: Move any new image folders from posts/assets/ → root assets/
local_assets = File.join(POSTS_DIR, "assets")
if Dir.exist?(local_assets)
  FileUtils.mkdir_p(ASSETS_DIR)
  Dir.glob(File.join(local_assets, "*")).each do |folder|
    dest = File.join(ASSETS_DIR, File.basename(folder))
    FileUtils.mv(folder, dest) unless Dir.exist?(dest)
  end
  begin
    Dir.rmdir(local_assets)
  rescue Errno::ENOTEMPTY
  end
end

# Step 3: Fix image paths in new .md files: assets/ → ../assets/
after_posts  = Dir.glob(File.join(POSTS_DIR, "*.md"))
new_posts    = after_posts - before_posts

new_posts.each do |post|
  content = File.read(post)
  fixed = content
    .gsub("path: assets/", "path: ../assets/")
    .gsub("](assets/", "](../assets/")
  File.write(post, fixed) if fixed != content
end

puts "\n    +#{new_posts.count} new posts  (#{after_posts.count} total)"

# Step 4: Rebuild README.md index
puts "\n==> Rebuilding README.md..."
readme = `ruby #{Shellwords.escape(File.join(__dir__, "index.rb"))}`
File.write(File.join(__dir__, "README.md"), readme)

puts "    Done — #{after_posts.count} posts indexed."
