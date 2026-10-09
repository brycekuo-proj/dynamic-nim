# Rebuilding the Huninn subset

`public/assets/fonts/huninn-subset.woff2` only contains the characters used by the
game's text. After adding new Chinese text, rebuild it (needs `pip install fonttools brotli`):

```sh
curl -LO https://raw.githubusercontent.com/google/fonts/main/ofl/huninn/Huninn-Regular.ttf
python3 -c "import glob;s=set();[s.update(open(f,encoding='utf-8').read()) for f in ['index.html',*glob.glob('src/**/*.js',recursive=True)]];open('chars.txt','w',encoding='utf-8').write(''.join(sorted(s)))"
pyftsubset Huninn-Regular.ttf --text-file=chars.txt --flavor=woff2 --layout-features='*' --output-file=public/assets/fonts/huninn-subset.woff2
```

Characters missing from the subset fall back to the system font.
