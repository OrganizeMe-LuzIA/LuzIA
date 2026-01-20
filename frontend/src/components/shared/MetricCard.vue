<template>
  <v-card :elevation="elevation" :class="cardClass">
    <v-card-text>
      <div class="d-flex align-center">
        <v-icon v-if="icon" :size="iconSize" :color="color" class="mr-4">
          {{ icon }}
        </v-icon>
        <div class="flex-grow-1">
          <div class="text-caption text-grey">{{ label }}</div>
          <div :class="valueClass">
            {{ formattedValue }}
          </div>
          <div v-if="subtitle" class="text-caption text-grey mt-1">
            {{ subtitle }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'primary',
  },
  suffix: {
    type: String,
    default: '',
  },
  decimals: {
    type: Number,
    default: 0,
  },
  subtitle: {
    type: String,
    default: '',
  },
  elevation: {
    type: [Number, String],
    default: 3,
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
})

const iconSize = computed(() => {
  const sizes = {
    small: 30,
    medium: 40,
    large: 50,
  }
  return sizes[props.size]
})

const valueClass = computed(() => {
  const classes = {
    small: 'text-h6',
    medium: 'text-h4',
    large: 'text-h3',
  }
  return `${classes[props.size]} font-weight-bold`
})

const cardClass = computed(() => {
  return props.size === 'small' ? 'pa-2' : ''
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toFixed(props.decimals) + props.suffix
  }
  return props.value + props.suffix
})
</script>
