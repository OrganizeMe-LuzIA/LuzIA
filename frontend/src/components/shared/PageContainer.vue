<template>
  <v-container fluid>
    <slot name="header">
      <v-row v-if="title || $slots.actions">
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center mb-4">
            <h1 v-if="title" class="text-h4 font-weight-bold">{{ title }}</h1>
            <div v-if="$slots.actions">
              <slot name="actions" />
            </div>
          </div>
        </v-col>
      </v-row>
    </slot>

    <slot />
  </v-container>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>
