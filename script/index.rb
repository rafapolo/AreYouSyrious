# how to generate this backup?
#1 -  ruby fetch.rb        (downloads missing posts + rebuilds README in one step)
#    or manually:
#    cd posts && ZMediumToMarkdown -u AreYouSyrious && cd ..
#    ruby index.rb > README.md

require "date"
require "shellwords"

hash = Hash.new { |h, k| h[k] = [] }

Dir.glob("posts/*.md").each do |p|
  begin
    grep = `grep "date: " #{Shellwords.escape(p)}`
    datestr = grep.split("\n").first
    datestr = datestr.split("###").first
    datestr.gsub!("date: ", "")
    date = DateTime.parse(datestr).strftime('%Y-%m-%d')

    descgrep = `grep "description" #{Shellwords.escape(p)}`
    descstr = descgrep.split("\n").first.gsub("description: ", "")

    hash[date] << [descstr, p]
  rescue
  end
end

puts "# AreYouSyrious @ Medium"
puts "backup of https://medium.com/are-you-syrious (fighting future cybernetic memory crises)"
puts "\n---\n"

hash.sort_by { |key, _| key }.each do |date, posts|
  posts.each do |desc, path|
    puts "- #{date} - [#{desc}](#{path})\n"
  end
end