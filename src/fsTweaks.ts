import * as fs from 'node:fs/promises';

export async function tryToCreateFolder(path: string): Promise<string> {
    let foldersNames = path.split('/');
    if (foldersNames[0] === '.' || foldersNames[0] === '') {
        foldersNames = foldersNames.slice(1);
    }

    let currentPath = '/';
    for (let i = 0; i < foldersNames.length; i++) {
        currentPath = currentPath + '/' + foldersNames[i];

        try {
            await fs.access(currentPath);
        } catch (err) {
            await fs.mkdir(currentPath);
        }
    }

    return path;
}

export async function createFileFromPages(
    filePath: string,
    findAllOptions: any,
    Model: any,
): Promise<void> {
    let items = await Model.findAndCountAll(findAllOptions);
    const itemsFile = await fs.open(filePath, 'a');

    try {
        let limit = findAllOptions.limit;
        const totalCount = items.count;
        const totalPages = Math.ceil(totalCount / limit);

        const itemsObjects = getItemsObjects(JSON.stringify(items.rows), true);

        const startFile = '[' + itemsObjects;
        await itemsFile.appendFile(startFile);

        for (let page = 1; page < totalPages; page++) {
            findAllOptions.offset = page * limit;
            items = await Model.findAndCountAll(findAllOptions);

            if (items.rows.length === 0) {
                continue;
            }

            const stringItems = getItemsObjects(JSON.stringify(items.rows));
            await itemsFile.appendFile(stringItems);
        }

        await itemsFile.appendFile(']');
    } finally {
        await itemsFile.close();
    }
}

function getItemsObjects(items: string, isFirstPage: boolean = false) {
    if (isFirstPage) {
        return items.slice(1, items.length - 1);
    }
    return ',' + items.slice(1, items.length - 1);
}
