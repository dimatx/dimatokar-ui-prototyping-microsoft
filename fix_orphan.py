f = open('src/workflows/adr-namespace/NewJobWizard.tsx', encoding='utf-8')
lines = f.readlines()
f.close()

# lines are 1-indexed in the IDE; 0-indexed here
# Orphan starts at logical line 956 (index 955) with ": {"
# and ends at logical line 1153 (index 1152) with "}\n\n" before the ARM Action comment

# Find start of orphan: a line that is exactly ": {\n"
start_idx = None
for i, l in enumerate(lines):
    if l.strip() == ': {':
        # verify prior line is "}\n"
        if i > 0 and lines[i-1].strip() == '}':
            start_idx = i - 1  # keep the closing "}" but remove the orphan
            break

if start_idx is None:
    print("ERROR: could not find orphan start")
    exit(1)

# The orphan ends at the next "}\n" followed by a blank line and a comment line
end_idx = None
for i in range(start_idx + 2, len(lines)):
    if lines[i].strip() == '}':
        # check the line after is blank and then comment
        if i+2 < len(lines) and lines[i+1].strip() == '' and lines[i+2].strip().startswith('/*'):
            end_idx = i + 1  # include the closing }
            break

if end_idx is None:
    print("ERROR: could not find orphan end")
    # Show context around start
    for j in range(start_idx, min(start_idx+10, len(lines))):
        print(f"{j+1}: {lines[j]}", end='')
    exit(1)

print(f"Removing lines {start_idx+1} to {end_idx+1} (orphan StepHubScope body)")
# Remove orphan: lines[start_idx+1 (the blank line before ': {') ... end_idx]
# Actually: start_idx is the '}' closing StepTarget, start_idx+1 is blank '\n', start_idx+2 is ': {\n'
# We want to keep start_idx (the '}') and remove start_idx+1 through end_idx
new_lines = lines[:start_idx+1] + ['\n'] + lines[end_idx+1:]

with open('src/workflows/adr-namespace/NewJobWizard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Done. Total lines: {len(new_lines)}")
f2 = open('src/workflows/adr-namespace/NewJobWizard.tsx', encoding='utf-8')
t = f2.read()
f2.close()
print("scopeMode remaining:", 'scopeMode' in t)
print("selectedHubs remaining:", 'selectedHubs' in t)
