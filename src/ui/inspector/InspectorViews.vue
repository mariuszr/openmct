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
  <div class="c-inspector__content" role="tabpanel" aria-label="Inspector Views"></div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    selectedTab: {
      type: Object,
      default: undefined
    }
  },
  watch: {
    selectedTab() {
      this.clearAndShowViewsForTab();
    }
  },
  mounted() {
    this.updateSelectionViews();
    this.openmct.editor.on('isEditing', this.updateSelectionViews);
    this.openmct.selection.on('change', this.updateSelectionViews);
  },
  unmounted() {
    this.openmct.editor.off('isEditing', this.updateSelectionViews);
    this.openmct.selection.off('change', this.updateSelectionViews);
  },
  methods: {
    updateSelectionViews() {
      this.clearViews();
      this.selectedViews = this.openmct.inspectorViews.get(this.openmct.selection.get());
      this.showViewsForTab();
    },
    clearViews() {
      if (this.visibleViews) {
        this.visibleViews.forEach((visibleView) => {
          visibleView.destroy();
        });

        this.visibleViews = [];
        this.$el.innerHTML = '';
      }
    },
    showViewsForTab() {
      this.visibleViews = this.selectedTab
        ? this.selectedViews.filter((view) => view.key === this.selectedTab.key)
        : [];

      this.visibleViews.forEach((visibleView) => {
        visibleView.show(this.$el);
      });
    },
    clearAndShowViewsForTab() {
      this.clearViews();
      this.showViewsForTab();
    }
  }
};
</script>
