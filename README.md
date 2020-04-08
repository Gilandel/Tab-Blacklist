# Tab-Blacklist-Policies

## Linux 
Places the configuration here: `/etc/opt/chrome/policies/managed/tab-blacklist.json`
```
{
  "ShowHomeButton": true,

  "3rdparty": {
    "extensions": {
      "lacjncdcelhlkaahompnkndmdeiglepn": {
        "BlacklistUrls": ["regexp|^.*?www.mywebsite.com\\/get-started.*?$", "https://test", "c|test"]
      }
    }
  }
}
```

## Windows
Define the registry key: `HKLM\Software\Policies\Chromium\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
Or
Define the registry key: `HKLM\Software\Policies\Google\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
```
"1" = "regexp|^.*?www.mywebsite.com\\/get-started.*?$"
"2" = "https://test"
"3" = "c|test"
```

## Supported modes
- regexp: tries to match the regular expression
- contains: searchs if the URL contains the text
- exact: searchs if the URL matches exactly the text

## Format
Each entry is formed by 2 parts:
- the mode:
	- 'regexp' or 'r' in shortcuts
	- 'contains' or 'c' in shortcuts 
	- 'exact' or nothing
- a pipe as separator
- the text or pattern to find

## Examples
- Regular expressions
`"regexp|^https?://.+\\.extranet\\.mydomain\\.com/.*\\.html$", "r|^https?://.+\\.extranet\\.mydomain\\.com/.*\\.html$"`

- Contains (beware of too short string)
`"contains|mydomain.com", "c|mydomain.com"`

- Exact match
`"exact|https://www.mydomain.com/index.html", "https://www.mydomain.com/index.html"`

## Documentation

[![How to configure policies on chromium](Policies explanation: http://www.chromium.org/administrators/configuring-policy-for-extensions)

## Thanks

Thanks to the original author [Jared DuPont](https://github.com/jrddupont)

## Licenses

Apache License, version 2.0
