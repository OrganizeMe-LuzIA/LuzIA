<template>
  <v-card :elevation="elevation">
    <v-card-title v-if="title">
      <v-icon v-if="icon" class="mr-2">{{ icon }}</v-icon>
      {{ title }}
    </v-card-title>
    <v-card-text :class="contentClass">
      <slot />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  elevation: {
    type: [Number, String],
    default: 3,
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
})

const contentClass = computed(() => {
  return props.noPadding ? 'pa-0' : ''
})
</script>
