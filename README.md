<!-- Please do not edit this file. Edit the `blah` field in the `package.json` instead. If in doubt, open an issue. -->


















# `$ ekoheat-boiler-parser`

 [![Support me on Patreon][badge_patreon]][patreon] [![Buy me a book][badge_amazon]][amazon] [![PayPal][badge_paypal_donate]][paypal-donations] [![Ask me anything](https://img.shields.io/badge/ask%20me-anything-1abc9c.svg)](https://github.com/IonicaBizau/ama) [![Version](https://img.shields.io/npm/v/ekoheat-boiler-parser.svg)](https://www.npmjs.com/package/ekoheat-boiler-parser) [![Downloads](https://img.shields.io/npm/dt/ekoheat-boiler-parser.svg)](https://www.npmjs.com/package/ekoheat-boiler-parser) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/@johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

<a href="https://www.buymeacoffee.com/H96WwChMy" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png" alt="Buy Me A Coffee"></a>







> A parser and stats generator for EkoHeat Pellet Boilers.

















## :cloud: Installation

You can install the package globally and use it as command line tool:


```sh
# Using npm
npm install --global ekoheat-boiler-parser

# Using yarn
yarn global add ekoheat-boiler-parser
```


Then, run `ekoheat-boiler-parser --help` and see what the CLI tool can do.


```
$ ekoheat-boiler-parser --help
Usage: ekoheat-boiler-parser <command> [options]

A parser and stats generator for EkoHeat Pellet Boilers.

Commands:
  download-current-frame   Download the current frame.
  extract-rectangles       Extract the rectangles from the frame.
  parse                    Parse the rectangles.
  save                     Parse the rectangles and save the output in the csv
                           file.
  stats                    Get the stats.
  keep-live-stream-active  Get the live stream.

Options:
  -c, --config <config>  The path to the config file (e.g. config.json).
  -h, --help             Displays this help.
  -v, --version          Displays version information.

Examples:
  $ ekoheat-boiler-parser extract-rectangles --config config.json
  $ ekoheat-boiler-parser parse --config config.json
  $ ekoheat-boiler-parser stats --config config.json

Documentation can be found at https://github.com/IonicaBizau/ekoheat-boiler-parser#readme.
```







I have installed an Android phone running DroidCam in front of the boiler screen. The phone streams the video through http and by using OCR technology I can extract the data from the boiler screen.

















## :question: Get Help

There are few ways to get help:



 1. Please [post questions on Stack Overflow](https://stackoverflow.com/questions/ask). You can open issues with questions, as long you add a link to your Stack Overflow question.
 2. For bug reports and feature requests, open issues. :bug:
 3. For direct and quick help, you can [use Codementor](https://www.codementor.io/johnnyb). :rocket:







## :memo: Documentation

For full API reference, see the [DOCUMENTATION.md][docs] file.












## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :sparkling_heart: Support my projects
I open-source almost everything I can, and I try to reply to everyone needing help using these projects. Obviously,
this takes time. You can integrate and use these projects in your applications *for free*! You can even change the source code and redistribute (even resell it).

However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:


 - Starring and sharing the projects you like :rocket:
 - [![Buy me a book][badge_amazon]][amazon]—I love books! I will remember you after years if you buy me one. :grin: :book:
 - [![PayPal][badge_paypal]][paypal-donations]—You can make one-time donations via PayPal. I'll probably buy a ~~coffee~~ tea. :tea:
 - [![Support me on Patreon][badge_patreon]][patreon]—Set up a recurring monthly donation and you will get interesting news about what I'm doing (things that I don't share with everyone).
 - **Bitcoin**—You can send me bitcoins at this address (or scanning the code below): `1P9BRsmazNQcuyTxEqveUsnf5CERdq35V6`

    ![](https://i.imgur.com/z6OQI95.png)


Thanks! :heart:
























## :scroll: License

[MIT][license] © [Ionică Bizău][website]






[license]: /LICENSE
[website]: https://ionicabizau.net
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
[badge_patreon]: https://ionicabizau.github.io/badges/patreon.svg
[badge_amazon]: https://ionicabizau.github.io/badges/amazon.svg
[badge_paypal]: https://ionicabizau.github.io/badges/paypal.svg
[badge_paypal_donate]: https://ionicabizau.github.io/badges/paypal_donate.svg
[patreon]: https://www.patreon.com/ionicabizau
[amazon]: http://amzn.eu/hRo9sIZ
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
