<template>
<div class="c-inspector__header">
    <div v-if="!multiSelect && !singleSelectNonObject"
         class="c-inspector__selected-w c-object-label"
         :class="typeCssClass"
    >
        <span class="c-inspector__selected c-object-label__name">{{ item.name }}</span>
    </div>
    <div v-if="singleSelectNonObject"
         class="c-inspector__selected-w  c-object-label"
         :class="typeCssClass"
    >
        <span class="c-inspector__selected  c-object-label__name c-inspector__selected--non-domain-object">Layout Object</span>
    </div>
    <div v-if="multiSelect"
         class="c-inspector__multiple-selected-w"
    >
        {{ itemsSelected }} items selected
    </div>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            domainObject: {},
            multiSelect: false,
            itemsSelected: 0
        }
    },
    computed: {
        item() {
            return this.domainObject || {};
        },
        type() {
            return this.openmct.types.get(this.item.type);
        },
        typeCssClass() {
            if (this.type.definition.cssClass === undefined) {
                return 'icon-object';
            }
            return this.type.definition.cssClass;
        },
        singleSelectNonObject() {
            return !this.item.identifier && !this.multiSelect;
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        updateSelection(selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                this.domainObject = {};
                return;
            }

            if (selection.length > 1) {
                this.multiSelect = true;
                this.domainObject = {};
                this.itemsSelected = selection.length;
                return;
            } else {
                this.multiSelect = false;
                this.domainObject = selection[0][0].context.item;
            }
        }
    }
}
</script>