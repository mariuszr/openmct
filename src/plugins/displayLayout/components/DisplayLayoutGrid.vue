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
  <div
    class="l-layout__grid-holder"
    :class="{ 'c-grid': showGrid }"
    role="grid"
    aria-label="Layout Grid"
    :aria-hidden="showGrid ? 'false' : 'true'"
    :aria-live="showGrid ? 'polite' : 'off'"
  >
    <div
      v-if="gridSize[0] >= 3"
      class="c-grid__x l-grid l-grid-x"
      :style="[
        {
          backgroundSize: gridSize[0] + 'px 100%',
          width: gridDimensions[0] + 'px',
          height: gridDimensions[1] + 'px'
        }
      ]"
    ></div>
    <div
      v-if="gridSize[1] >= 3"
      class="c-grid__y l-grid l-grid-y"
      :style="[
        {
          backgroundSize: '100%' + gridSize[1] + 'px',
          width: gridDimensions[0] + 'px',
          height: gridDimensions[1] + 'px'
        }
      ]"
    ></div>
  </div>
</template>

<script>
export default {
  props: {
    gridSize: {
      type: Array,
      required: true,
      validator: (arr) => arr && arr.length === 2 && arr.every((el) => typeof el === 'number')
    },
    showGrid: {
      type: Boolean,
      required: true
    },
    gridDimensions: {
      type: Array,
      required: true,
      validator: (arr) => arr && arr.length === 2 && arr.every((el) => typeof el === 'number')
    }
  }
};
</script>
