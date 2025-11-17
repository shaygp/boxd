#!/usr/bin/env ruby

require 'xcodeproj'

project_path = '/Users/mac/Downloads/boxboxd-web/ios/App/App.xcodeproj'
plist_path = '/Users/mac/Downloads/boxboxd-web/ios/App/App/GoogleService-Info.plist'

project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Get the App group
app_group = project.main_group.find_subpath('App', true)

# Add the plist file
file_ref = app_group.new_reference(plist_path)

# Add to the resources build phase
target.resources_build_phase.add_file_reference(file_ref)

# Save the project
project.save

puts "✅ GoogleService-Info.plist added to Xcode project"
