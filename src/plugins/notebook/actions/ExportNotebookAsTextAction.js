import {saveAs} from 'saveAs';
import Moment from 'moment';

const UNKNOWN_USER = 'Unknown';
const UNKNOWN_TIME = 'Unknown';

export default class ExportNotebookAsTextAction {

    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-export';
        this.description = 'Exports notebook contents as a text file';
        this.group = "action";
        this.key = 'exportNotebookAsText';
        this.name = 'Export Notebook as Text';
        this.priority = 1;
    }

    invoke(objectPath) {
        this.showForm(objectPath);
    }

    getTagName(tagId, availableTags) {
        const foundTag = availableTags.find(tag => tag.id === tagId);
        if (foundTag) {
            return foundTag.label;
        } else {
            return tagId;
        }
    }

    getTagsForEntry(entry, domainObjectKeyString, annotations) {
        const foundTags = [];
        annotations.forEach(annotation => {
            const target = annotation.targets?.[domainObjectKeyString];
            if (target?.entryId === entry.id) {
                annotation.tags.forEach(tag => {
                    if (!foundTags.includes(tag)) {
                        foundTags.push(tag);
                    }
                });
            }
        });

        return foundTags;
    }

    formatTimeStamp(timestamp) {
        if (timestamp) {
            return `${Moment.utc(timestamp).format('YYYY-MM-DD HH:mm:ss')} UTC`;
        } else {
            return UNKNOWN_TIME;
        }
    }

    appliesTo(objectPath) {
        const domainObject = objectPath[0];
        const type = this.openmct.types.get(domainObject.type);

        return type?.definition?.name === 'Notebook';
    }

    async onSave(changes, objectPath) {
        const availableTags = this.openmct.annotation.getAvailableTags();
        const identifier = objectPath[0].identifier;
        const domainObject = await this.openmct.objects.get(identifier);
        let foundAnnotations = [];
        // only load annotations if there are tags
        if (availableTags.length) {
            foundAnnotations = await this.openmct.annotation.getAnnotations(domainObject.identifier);
        }

        let notebookAsText = `# ${domainObject.name}\n\n`;

        if (changes.exportMetaData) {
            const createdTimestamp = domainObject.created;
            const createdBy = domainObject.createdBy ?? UNKNOWN_USER;
            const modifiedBy = domainObject.modifiedBy ?? UNKNOWN_USER;
            const modifiedTimestamp = domainObject.modified ?? domainObject.created;
            notebookAsText += `Created on ${this.formatTimeStamp(createdTimestamp)} by user ${createdBy}\n\n`;
            notebookAsText += `Updated on ${this.formatTimeStamp(modifiedTimestamp)} by user ${modifiedBy}\n\n`;
        }

        const notebookSections = domainObject.configuration.sections;
        const notebookEntries = domainObject.configuration.entries;

        notebookSections.forEach(section => {
            notebookAsText += `## ${section.name}\n\n`;

            const notebookPages = section.pages;

            notebookPages.forEach(page => {
                notebookAsText += `### ${page.name}\n\n`;

                const notebookPageEntries = notebookEntries[section.id]?.[page.id];
                notebookPageEntries.forEach(entry => {
                    if (changes.exportMetaData) {
                        const createdTimestamp = entry.createdOn;
                        const createdBy = entry.createdBy ?? UNKNOWN_USER;
                        const modifiedBy = entry.modifiedBy ?? UNKNOWN_USER;
                        const modifiedTimestamp = entry.modified ?? entry.created;
                        notebookAsText += `Created on ${this.formatTimeStamp(createdTimestamp)} by user ${createdBy}\n\n`;
                        notebookAsText += `Updated on ${this.formatTimeStamp(modifiedTimestamp)} by user ${modifiedBy}\n\n`;
                    }

                    if (changes.exportTags) {
                        const domainObjectKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
                        const tags = this.getTagsForEntry(entry, domainObjectKeyString, foundAnnotations);
                        const tagNames = tags.map(tag => this.getTagName(tag, availableTags));
                        if (tagNames) {
                            notebookAsText += `Tags: ${tagNames.join(', ')}\n\n`;
                        }
                    }

                    notebookAsText += `${entry.text}\n\n`;
                });
            });
        });

        const blob = new Blob([notebookAsText], {type: "text/markdown"});
        const fileName = domainObject.name + '.md';
        saveAs(blob, fileName);
    }

    async showForm(objectPath) {
        const formStructure = {
            title: "Export Notebook Text",
            sections: [
                {
                    rows: [
                        {
                            key: "exportMetaData",
                            control: "toggleSwitch",
                            name: "Include Metadata (created/modified, etc.)",
                            required: true,
                            value: false
                        },
                        {
                            name: "Include Tags",
                            control: "toggleSwitch",
                            required: true,
                            key: 'exportTags',
                            value: false
                        }
                    ]
                }
            ]
        };

        const changes = await this.openmct.forms.showForm(formStructure);

        return this.onSave(changes, objectPath);
    }
}