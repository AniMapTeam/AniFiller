# AniFiller

Structured anime canon and filler data.

```
Total Shows count: {show_count}
```

## The Lists

- [anifiller.json](https://github.com/itss0n1c/anifiller/releases/latest/download/anifiller.json): A JSON file containing structured data about anime canon and filler episodes.
- [anifiller.min.json](https://github.com/itss0n1c/anifiller/releases/latest/download/anifiller.min.json): A minified version of the JSON file for easier use in applications.

## Shows

<details>
<summary>Bundled Shows</summary>

{shows_table}

</details>

## Structure

```ts
interface Show {
    slug: string;
    title: string;
    mappings: {
        anilist_id: number;
        mal_id: number;
    };
    episodes: {
        episode: number;
        title: string;
        type: "manga-canon" | "filler" | "mixed-manga" | "anime-canon";
        aired_date: `${number}-${number}-${number}`; // YYYY-MM-DD
    }[];
}
```

## Contributing

Contribution is welcome! Either by [Opening an Issue](https://github.com/itss0n1c/AniFiller/issues) or by [Submitting a Pull Request](https://github.com/itss0n1c/AniFiller/pulls).

Opening an issue is the best way to suggest a new show or report an error in the data. If you have a specific change in mind.

However, if you have already made the change and want to submit it directly, you can:

1. [Fork the repository](https://github.com/itss0n1c/AniFiller/fork)
2. Create a new branch (`git checkout -b new_branch`)
3. Create or edit within the [`data`](./data) directory
4. Commit your changes (`git commit -am 'commit message here'`)
5. Push to the branch (`git push origin new_branch`)
6. [Open a Pull Request](https://github.com/itss0n1c/AniFiller/compare)

For most contributions, you should only need to edit files in the [`data`](./data) directory.

Avoid modifying the [`src`](./src) directory unless your pull request is specifically intended to change the generation or validation scripts. If you want to contribute to those scripts, please open an issue or a pull request with your changes.
