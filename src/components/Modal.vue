<template>
    <div class="modal" :class="{'show': show}">
        <div class="modal__content">
            <button class="modal__close" @click="close"> 
                <Close /> 
            </button>
            <h2>Настройки</h2>
            <div>
                <span>Выберите тему</span>
                <div class="modal__content__row">
                    <button class="modal__content__row__item classic" @click="setTheme('classic')">
                        <span>Класический</span>
                    </button>
                    <button class="modal__content__row__item design__pink" @click="setTheme('design__pink')">
                        <span>Розовый</span>
                    </button>                    
                    <button class="modal__content__row__item design__blue" @click="setTheme('design__blue')">
                        <span>Синий</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import Close from "./Close.vue";

defineProps({
  show: Boolean,
})

const emit = defineEmits(['close', 'changeTheme'])

const close = () => {
    emit('close')
}

const setTheme = (theme) => {
    localStorage.setItem('theme', theme);
    emit('changeTheme', theme);
    emit('close')
}
</script>

<style scoped lang="scss">
.modal {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #faf8ef;
    transform: translateX(-100%);
    transition: .5s;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;

    &__close {
        position: fixed;
        padding: 20px;
        top: 10px;
        right: 0;
        background: transparent;
    }

    &.show {
        transform: translateX(0);
    }

    &__content {
        color: #776e65;

        &__row {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
            flex-wrap: wrap;

            &__item {
                border-radius: 50px;
                border: 1px solid #8f7a66;
                width: 150px;
                height: 150px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                color: #776e65;
                box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);

                &.design {
                    &__pink {
                        background-color: #E0B0FF;
                    }
                    &__blue {
                        background-color: #A0C4FF;
                    }
                }
            }
        }
    }
}
</style>