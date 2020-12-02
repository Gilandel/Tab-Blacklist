# Tab-Blacklist-Policies

- Automatically closes blacklisted tabs
- ReFocus on previous active tab
- Loads configuration from Chrome Policies (chrome://policy)

## Chrome Web Store
[Chrome Web Store URL](https://chrome.google.com/webstore/detail/tabs-blacklist-policies/lacjncdcelhlkaahompnkndmdeiglepn)

## Linux 
Places the configuration here: `/etc/opt/chrome/policies/managed/tab-blacklist.json`
```
{
  "3rdparty": {
    "extensions": {
      "lacjncdcelhlkaahompnkndmdeiglepn": {
        "BlacklistUrls": [
          "regexp|^https?:\\/\\/(.*\\.)?mywebsite\\.com\\/get-started.*$",
          "https://test",
          "c|test"
        ]
      }
    }
  }
}
```

Note: Use double backslash in regular expression to escape a character.

## Windows
Defines the registry key and its values following your Windows version:
- 32bits: `HKLM\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
- 64bits: `HKLM\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
```
"1" = "regexp|^https?:\/\/(.*\.)?mywebsite\.com\/get-started.*$"
"2" = "https://test"
"3" = "c|test"
```

Note: Use simple backslash in regular expression to escape a character.

## Supported modes
- regexp: tries to match the regular expression
- contains: searchs if the URL contains the text
- exact: searchs if the URL matches exactly the text

## Format
Each entry is formed by 4 parts at maximum:
- the management of opened tabs before extension's installation
- the mode:
	- 'regexp' or 'r' as shortcut
	- 'contains' or 'c' as shortcut
	- 'exact' or nothing
- a pipe as separator
- the text or pattern to find

And at minimum:
- the text or pattern to find

## Examples
- Regular expressions (watch out for too vague patterns)
```
"regexp|^https?://.+\\.extranet\\.mydomain\\.com/.*\\.html$",
"r|^https?://.+\\.extranet\\.mydomain\\.com/.*\\.html$"
```

- Contains (beware of too short string)
```
"contains|mydomain.com",
"c|mydomain.com"
```

- Exact match
```
"exact|https://www.mydomain.com/index.html",
"https://www.mydomain.com/index.html"
```

- Avoid closing tab already opened before extension's installation (see exclamation symbol at the beginning)
```
"!exact|https://www.mydomain.com/index.html",
"!https://www.mydomain.com/index.html"
```

## External documentation

[How to configure policies on chromium](http://www.chromium.org/administrators/configuring-policy-for-extensions)

## Thanks

Thanks to the original author [Jared DuPont](https://github.com/jrddupont)

## License

Apache License, version 2.0
