# FF7 Flat Wiki Migration Tool
> Pulls and converts all content from [FF Inside Wiki](https://wiki.ffrtt.ru) into [Markdown](https://www.markdownguide.org/basic-syntax/)

![alt text](https://i.ibb.co/x2zGG0V/Engine-parts.jpg "Engine parts")

## Rationale
See [ff7-flat-wiki](https://github.com/ff7-mods/ff7-flat-wiki) for more information.

> TLDR;
The existing [FF Inside Wiki](https://wiki.ffrtt.ru) is a vast and amazing treasure trove of information, however, there are questions about resiliency, editability and longevity. In the interest of retaining the knowledge in this area, we should propose at least an independent backup.
This repo contains the migration tool, the migrated data will be loaded persisted in  [ff7-flat-wiki](https://github.com/ff7-mods/ff7-flat-wiki)

## Installation
- Install [pandoc](https://pandoc.org/installing.html)
- Install any modern nodejs version
- Clone git repo - `git clone https://github.com/ff7-mods/ff7-flat-wiki-migration-tool.git`
- Open directory `cd ff7-flat-wiki-migration-tool`
- Install `npm i`

## Usage
- Download and convert by running `npm start`
- It will download and convert the wiki data and assets into the `ff7-flat-wiki-migration-tool/output` directory
- Raw wikimedia format contained in `ff7-flat-wiki-migration-tool/output/wikimedia`
- Pandoc markdown output in `ff7-flat-wiki-migration-tool/output/pandoc`
- (Opinionated) markdown adjusted to include relative link and image adjustments in `ff7-flat-wiki-migration-tool/output/markdown`
- If reinitialising the whole repo (from the latest mediawiki content) > Github pages format with template config in `ff7-flat-wiki-migration-tool/output/github-pages`. From there, copy and commit into separate [ff7-flat-wiki](https://github.com/ff7-mods/ff7-flat-wiki) repo
- To preview the output as it would appear in the git repository, you can [follow these instructions](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll), which are:
    - Install jekyll
    - Open directory `cd ff7-flat-wiki-migration-tool/output/github-pages/docs`
    - Run `jekyll serve`
    - Open browser `http://localhost:4000`

This data serves as an initial loading set for [ff7-flat-wiki](https://github.com/ff7-mods/ff7-flat-wiki).
