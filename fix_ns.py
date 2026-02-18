f = open('src/workflows/adr-namespace/NewJobWizard.tsx', encoding='utf-8')
t = f.read()
f.close()

amp2 = '&&'

# Fix 1: subtitle in My Namespace card
old1 = (
    '{hubs.length} IoT\xa0Hubs\xa0\xb7\xa0{totalHubDevices.toLocaleString()} devices\n'
    '              {aioEnabled ' + amp2 + ' <>\xa0\xb7\xa0{aioInstances.length} IoT\xa0Operations instance{aioInstances.length !== 1 ? \'s\' : \'\'}</>}\n'
    '            </p>'
)
new1 = (
    '{hubs.length} IoT\xa0Hubs\xa0\xb7\xa0{aioInstances.length} IoT\xa0Operations instance{aioInstances.length !== 1 ? \'s\' : \'\'}\n'
    '              \xa0\xb7\xa0{totalHubDevices.toLocaleString()} devices\n'
    '              {totalAssets > 0 ' + amp2 + ' <>\xa0\xb7\xa0{totalAssets.toLocaleString()} assets</>}\n'
    '            </p>'
)
if old1 in t:
    t = t.replace(old1, new1)
    print('Fix 1 applied')
else:
    print('Fix 1 not found')

# Fix 2: My Namespace in Review
idx2 = t.find('My Namespace \u2014 {hubs.length}')
if idx2 != -1:
    p_start = t.rfind('<p ', 0, idx2)
    p_end = t.find('</p>', idx2) + 4
    new_p = (
        '<p className="text-xs text-foreground">\n'
        '                My Namespace \u2014 {hubs.length} IoT\xa0Hubs\xa0\xb7\xa0{aioInstances.length} IoT\xa0Operations instance{aioInstances.length!==1?\'s\':\'\'}\n'
        '                {" \xb7 "}{hubs.reduce((s,h)=>s+h.devices,0).toLocaleString()} devices\n'
        '                {aioInstances.reduce((s,a)=>s+a.assets,0) > 0 ' + amp2 + ' <> \xb7 {aioInstances.reduce((s,a)=>s+a.assets,0).toLocaleString()} assets</>}\n'
        '              </p>'
    )
    t = t[:p_start] + new_p + t[p_end:]
    print('Fix 2 applied')
else:
    print('Fix 2 not found - showing context:')
    idx = t.find('My Namespace')
    print(repr(t[idx:idx+200]))

with open('src/workflows/adr-namespace/NewJobWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(t)
print('Done')
