require "date"
require "byebug"

hash = {}

Dir.glob("posts/*.md").each do |p|
  begin
    grep = `grep "date: " #{p}`
    datestr = grep.split("\n").first
    datestr = datestr.split("###").first
    datestr.gsub!("date: ", "")
    date = DateTime.parse(datestr).strftime('%Y-%m-%d')
    
    descgrep = `grep "description" #{p}`
    descstr = descgrep.split("\n").first.gsub("description: ", "")
    
    hash[date] = [descstr, p]  
  rescue
    # byebug
  end
end

puts "# AreYouSyrious @ Medium"
puts "backup of https://medium.com/are-you-syrious (fighting future cybernetic memory crises)"
puts "\n---\n"

result = hash.sort_by { |key| key }.to_h
result.each do |date,v|
  puts "- #{date} - [#{v[0]}](#{v[1]})\n"
end