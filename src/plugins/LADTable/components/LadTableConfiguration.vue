<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <div class="c-inspect-properties">
    <div class="c-inspect-properties__header">Table Column Visibility</div>
    <ul class="c-inspect-properties__section">
      <li v-for="(title, key) in headers" :key="key" class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Show or hide column">
          <label :for="key + 'ColumnControl'">{{ title }}</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            :id="key + 'ColumnControl'"
            type="checkbox"
            :checked="configuration.hiddenColumns[key] !== true"
            @change="toggleColumn(key)"
          />
          <span v-if="!isEditing && configuration.hiddenColumns[key] !== true">Visible</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import LADTableConfiguration from '../LADTableConfiguration.js';

export default {
  inject: ['openmct'],
  data() {
    const selection = this.openmct.selection.get();
    const domainObject = selection[0][0].context.item;
    const ladTableConfiguration = new LADTableConfiguration(domainObject, this.openmct);

    return {
      ladTableConfiguration,
      isEditing: this.openmct.editor.isEditing(),
      configuration: ladTableConfiguration.getConfiguration(),
      items: [],
      ladTableObjects: [],
      ladTelemetryObjects: {}
    };
  },
  computed: {
    headers() {
      const fullHeaders = {
        timestamp: 'Timestamp',
        type: 'Type'
      };
      // check hasUnits and limitColumnName and add then to fullHeaders
      this.items.forEach((item) => {
        if (item.hasUnits) {
          fullHeaders.units = 'Units';
        }
        if (item.limitDefinition) {
          const limits = Object.keys(item.limitDefinition);
          limits.forEach((limit) => {
            fullHeaders[limit] = limit;
          });
        }
      });
      return fullHeaders;
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleEdit);
    this.composition = this.openmct.composition.get(this.ladTableConfiguration.domainObject);

    if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
      this.composition.on('add', this.addItem);
      this.composition.on('remove', this.removeItem);
    } else {
      this.compositions = [];
      this.composition.on('add', this.addLadTable);
      this.composition.on('remove', this.removeLadTable);
    }

    this.composition.load();
  },
  unmounted() {
    this.ladTableConfiguration.destroy();
    this.openmct.editor.off('isEditing', this.toggleEdit);

    if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
      this.composition.off('add', this.addItem);
      this.composition.off('remove', this.removeItem);
    } else {
      this.composition.off('add', this.addLadTable);
      this.composition.off('remove', this.removeLadTable);
      this.compositions.forEach((c) => {
        c.composition.off('add', c.addCallback);
        c.composition.off('remove', c.removeCallback);
      });
    }
  },
  methods: {
    async addItem(domainObject) {
      const item = {};
      item.domainObject = domainObject;
      item.key = this.openmct.objects.makeKeyString(domainObject.identifier);
      item.limitDefinition = await this.openmct.telemetry.limitDefinition(domainObject).limits();

      const metadata = this.openmct.telemetry.getMetadata(domainObject);
      const valueMetadatas = metadata ? metadata.valueMetadatas : [];
      const metadataWithUnits = valueMetadatas.filter((metadatum) => metadatum.unit);

      item.hasUnits = metadataWithUnits.length > 0;

      this.items.push(item);
    },
    removeItem(identifier) {
      const keystring = this.openmct.objects.makeKeyString(identifier);
      const index = this.items.findIndex((item) => keystring === item.key);

      this.items.splice(index, 1);
    },
    addLadTable(domainObject) {
      let ladTable = {};
      ladTable.domainObject = domainObject;
      ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);

      if (!this.ladTelemetryObjects) {
        this.ladTelemetryObjects = {};
      }
      this.ladTelemetryObjects[ladTable.key] = [];
      this.ladTableObjects.push(ladTable);

      const composition = this.openmct.composition.get(ladTable.domainObject);
      composition.on('add', this.addItem);
      composition.on('remove', this.removeItem);
      composition.load();

      this.compositions.push({
        composition,
        addCallback: this.addItem,
        removeCallback: this.removeItem
      });
    },
    removeLadTable(identifier) {
      const index = this.ladTableObjects.findIndex(
        (ladTable) => this.openmct.objects.makeKeyString(identifier) === ladTable.key
      );
      const ladTable = this.ladTableObjects[index];

      delete this.ladTelemetryObjects[ladTable.key];
      this.ladTableObjects.splice(index, 1);
    },
    combineKeys(ladKey, telemetryObjectKey) {
      return `${ladKey}-${telemetryObjectKey}`;
    },
    toggleColumn(key) {
      const isHidden = this.configuration.hiddenColumns[key] === true;

      this.configuration.hiddenColumns[key] = !isHidden;
      this.ladTableConfiguration.updateConfiguration(this.configuration);
    },
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    }
  }
};
</script>
