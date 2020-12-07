# Tab-Blacklist-Policies

- Loads configuration from Chrome Policies
- Automatically closes tabs with blacklisted URL
- Tries to refocus on previous active tab

## Chrome Web Store
[Chrome Web Store URL](https://chrome.google.com/webstore/detail/tabs-blacklist-policies/lacjncdcelhlkaahompnkndmdeiglepn)

## Chrome Policies: chrome://policy

Example:

![Chrome policy preview](https://github.com/Gilandel/Tab-Blacklist/blob/master/preview.png)

## Included debug mode

Local direct link: chrome-extension://lacjncdcelhlkaahompnkndmdeiglepn/debug.html

![Debug page preview](https://github.com/Gilandel/Tab-Blacklist/blob/master/debug.png)

Note: reacheable through reloading policies after setting debug to true

## Linux 
Places the configuration here: `/etc/opt/chrome/policies/managed/tab-blacklist.json`
```
{
  "3rdparty": {
    "extensions": {
      "lacjncdcelhlkaahompnkndmdeiglepn": {
        "Debug": false,
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

:h Note 1: Use double backslash in regular expression to escape a character.
:h Note 2: "Debug" property is optional and set to false by default

## Windows
Defines the registry key and its values following your Windows version:
- 32bits: `HKLM\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
- 64bits: `HKLM\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
```
"1" = "regexp|^https?:\/\/(.*\.)?mywebsite\.com\/get-started.*$"
"2" = "https://test"
"3" = "c|test"
```

:h Note 1: Use simple backslash in regular expression to escape a character.
:h Note 2: Type of each element ("1"...): 'REG_SZ'.

Enables debug page *(optional, set to false by default)*:
- 32bits: `HKLM\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy`
- 64bits: `HKLM\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy`
```
"Debug" = "0"
```

Note 3: "Debug" type element: 'REG_DWORD' ("0" means disabled and "1" enabled).

## Supported modes
- regexp: tries to match the regular expression
- contains: searchs if the URL contains the text
- exact: searchs if the URL matches exactly the text

## Format
Each entry is formed by 4 parts at maximum:
- a symbol *(cannot be cumulated) (optional)*:
  - exclamation mark: if present, on startup, the extension will not close already matching tabs
  - plus: if present, the extension will close all matching tabs even those opened by user
- the matching mode:
	- 'regexp' or 'r' as shortcut
	- 'contains' or 'c' as shortcut
	- 'exact' or nothing
- a pipe as separator *(required, may be omitted if mode is nothing (aka 'exact'))*
- the text or pattern to find *(required)*

## Examples
- Regular expressions *(watch out for too vague patterns)*
```
"regexp|^https?://.+\\.extranet\\.mydomain\\.com/.*\\.html$",
"r|^https?://.+\\.extranet\\.mydomain\\.com/.*\\.html$"
```

- Contains *(beware of too short string)*
```
"contains|mydomain.com",
"c|mydomain.com"
```

- Exact match
```
"exact|https://www.mydomain.com/index.html",
"https://www.mydomain.com/index.html"
```

- Avoid closing tab already opened before extension's startup *(see exclamation mark at the beginning)*
```
"!exact|https://www.mydomain.com/index.html",
"!https://www.mydomain.com/index.html"
```

- Close tab even opened by user *(see plus symbol at the beginning)*
```
"+exact|https://www.mydomain.com/index.html",
"+https://www.mydomain.com/index.html"
```

## External documentation

[How to configure policies on chromium](http://www.chromium.org/administrators/configuring-policy-for-extensions)

## Thanks

Thanks to the original author [Jared DuPont](https://github.com/jrddupont)

## License

Apache License, version 2.0
