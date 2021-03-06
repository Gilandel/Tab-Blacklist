# Tab-Blacklist-Policies

- Loads configuration from Chrome Policies
- Automatically closes tabs whose URL is blacklisted
- Tries to refocus on previous active tab

## Chrome Web Store
[Chrome Web Store URL](https://chrome.google.com/webstore/detail/tabs-blacklist-policies/lacjncdcelhlkaahompnkndmdeiglepn)

## Chrome Policies: chrome://policy

Example:

![Chrome policy preview](https://github.com/Gilandel/Tab-Blacklist/blob/master/preview.png)

## Debug mode

This extension includes a debug mode, only filled if debug is enabled in policies.

The page can be reached through this URL: chrome-extension://lacjncdcelhlkaahompnkndmdeiglepn/debug.html

![Debug page preview](https://github.com/Gilandel/Tab-Blacklist/blob/master/debug.png)

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

Note 1: Use double backslash in regular expression to escape a character.

Note 2: "Debug" property is optional and set to false by default.

## Windows
Defines the registry key and its values following your Windows version:
- 32bits: `HKLM\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
- 64bits: `HKLM\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls`
```
"1"="regexp|^https?:\/\/(.*\.)?mywebsite\.com\/get-started.*$"
"2"="https://test"
"3"="c|test"
```

Note 1: Use simple backslash in regular expression to escape a character.

Note 2: Type of each element ("1"...): 'REG_SZ'.

Enables debug page *(optional, set to false by default)*:
- 32bits: `HKLM\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy`
- 64bits: `HKLM\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy`
```
"Debug"=dword:00000001
```

Note 3: "Debug" type element: 'REG_DWORD' ("dword:00000000" means disabled and "dword:00000001" enabled).

Example on Windows 10, an export of the registry:
```
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn]

[HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy]
"Debug"=dword:00000001

[HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Policies\Google\Chrome\3rdparty\extensions\lacjncdcelhlkaahompnkndmdeiglepn\policy\BlacklistUrls]
"1"="+https://www.virtru.com/get-started/"
```

## Supported modes
- regexp: checks if the URL matches the regular expression
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

## Donation

[Just discover WhalInvest a french cryptocurrencies bot and farmer](https://www.whalinvest.com/register?referralCode=BJFF2VE5DL)
