# Unsafe URLs

[click me](about:error)

[obfuscated](about:error)

[vbscript](about:error)

[data](about:error)

[javascript:alert(1)](about:error)

[invalid](about:error)

[https](https://www.example.com/) [mail](mailto:info@example.com) [tel](tel:+15551234) [relative](/relative) [fragment](#top)

![][image0]

![][image1]

![][image0]

\<img src=x onerror=alert(1)> and \<a href="javascript:alert(1)">x\</a>

+------------------------------------------------------------------------------+
| Cards                                                                        |
+---------------------------+--------------------------------------------------+
| [block link](about:error) | [safe block link](https://www.example.com/block) |
+---------------------------+--------------------------------------------------+

+------------------------------------------------------+
| Metadata                                             |
+---------------------+--------------------------------+
| title               | Unsafe URLs                    |
+---------------------+--------------------------------+
| og:image            | ![][image2]                    |
+---------------------+--------------------------------+
| image               | ![][image3]                    |
+---------------------+--------------------------------+
| canonical           | about:error                    |
+---------------------+--------------------------------+
| og:url              | https\://www\.example.com/page |
+---------------------+--------------------------------+
| twitter:url         | about:error                    |
+---------------------+--------------------------------+
| og:video:secure_url | about:error                    |
+---------------------+--------------------------------+
| description         | Note: not a url                |
+---------------------+--------------------------------+
| hreflang-de         | about:error                    |
+---------------------+--------------------------------+
| hreflang-fr         | https\://www\.example.com/fr/  |
+---------------------+--------------------------------+

[image0]: about:error

[image1]: data:image/png;base64,iVBORw0KGgo=

[image2]: about:error

[image3]: https://www.example.com/image.png
