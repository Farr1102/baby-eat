<script setup lang="ts">
import { showToast } from 'vant';

definePageMeta({
  layout: false,
  title: '登录',
});

useHead({ title: '登录 - Little Eleven' });

const { login, isLoggedIn } = useAuth();

const username = ref('');
const password = ref('');
const submitting = ref(false);

if (isLoggedIn.value) {
  navigateTo('/');
}

async function handleSubmit() {
  if (!username.value || !password.value) {
    showToast({ type: 'fail', message: '请输入用户名和密码' });
    return;
  }
  submitting.value = true;
  try {
    await login(username.value, password.value);
    showToast({ type: 'success', message: '登录成功' });
    navigateTo('/');
  } catch (e: any) {
    showToast({ type: 'fail', message: e.message || '登录失败' });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6" style="background: var(--app-bg)">
    <div class="w-full max-w-sm">
      <h1 class="text-center text-3xl font-bold text-pink-500 mb-2 tracking-tight">
        Little Eleven
      </h1>
      <p class="text-center mb-8" style="color: var(--app-ink-3)">
        宝宝成长记录
      </p>

      <van-form @submit="handleSubmit">
        <van-cell-group inset>
          <van-field
            v-model="username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          />
          <van-field
            v-model="password"
            name="password"
            label="密码"
            type="password"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="mt-6 px-4">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="submitting"
            color="#ec489a"
          >
            登录
          </van-button>
        </div>
      </van-form>

      <p class="text-center mt-6" style="color: var(--app-ink-3)">
        还没有账号？
        <NuxtLink to="/register" class="text-pink-500">
          去注册
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
