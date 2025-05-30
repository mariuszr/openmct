/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import mount from 'utils/mount';

import StylesInspectorView from './StylesInspectorView.vue';
import stylesManager from './StylesManager.js';

const NON_STYLABLE_TYPES = [
  'clock',
  'conditionSet',
  'eventGenerator',
  'eventGeneratorWithAcknowledge',
  'example.imagery',
  'folder',
  'gantt-chart',
  'generator',
  'hyperlink',
  'notebook',
  'restricted-notebook',
  'summary-widget',
  'time-strip',
  'timelist',
  'timer',
  'webPage'
];

function isLayoutObject(selection, objectType) {
  //we allow conditionSets to be styled if they're part of a layout
  return (
    selection.length > 1 &&
    (objectType === 'conditionSet' || NON_STYLABLE_TYPES.indexOf(objectType) < 0)
  );
}

function isCreatableObject(object, typeObject) {
  return NON_STYLABLE_TYPES.indexOf(object.type) < 0 && typeObject.definition.creatable;
}

export default function StylesInspectorViewProvider(openmct) {
  return {
    key: 'stylesInspectorView',
    name: 'Styles',
    glyph: 'icon-paint-bucket',
    canView: function (selection) {
      const objectSelection = selection?.[0];
      const objectContext = objectSelection?.[0]?.context;
      const domainObject = objectContext?.item;
      const hasStyles = domainObject?.configuration?.objectStyles;
      const isFlexibleLayoutContainer =
        domainObject?.type === 'flexible-layout' && objectContext.type === 'container';
      const isLayoutItem = objectContext?.layoutItem;

      if ((isLayoutItem || hasStyles) && !isFlexibleLayoutContainer) {
        return true;
      }

      if (!domainObject || isFlexibleLayoutContainer) {
        return false;
      }

      const typeObject = openmct.types.get(domainObject.type);

      return (
        isLayoutObject(objectSelection, domainObject.type) ||
        isCreatableObject(domainObject, typeObject)
      );
    },
    view: function (selection) {
      let _destroy = null;

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                StylesInspectorView
              },
              provide: {
                openmct,
                stylesManager,
                selection
              },
              template: `<StylesInspectorView />`
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        showTab: function (isEditing) {
          return true;
        },
        priority: function () {
          return openmct.editor.isEditing() ? openmct.priority.DEFAULT : openmct.priority.LOW;
        },
        destroy: function () {
          if (_destroy) {
            _destroy();
          }
        }
      };
    }
  };
}
