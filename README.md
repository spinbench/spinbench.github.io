## SPIN-Bench

This website is adapted from [OctoTools](https://octotools.github.io/), [Nerfies website](https://nerfies.github.io) and [MathVista website](https://mathvista.github.io).

### Website License
<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.


### Update the website

```sh
git add -A
git commit -m "Update website"
git push
```

### Local server

```sh
# Navigate to your project directory
cd /path/to/spinbench.github.io

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

After starting either server, you can access your site at:

```
http://localhost:8000 (for Python server)
http://localhost:8080 (for http-server)
```

### Development tips

After you start the local server and change something, most of time you can just refresh the page to see the changes. However, sometimes your browser may cache the old content and you need to clear the cache or do a hard refresh. 

Another recommended approach: If you are using Chrome, you can use Command + Option + I (macos shortcut) to open the developer tools, select the Network tab, and check the "Disable cache" option. This will prevent the browser from caching the content.