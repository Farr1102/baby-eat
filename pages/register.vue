<script setup lang="ts">
import { showToast } from 'vant';

definePageMeta({
  layout: false,
  title: '注册',
});

useHead({ title: '注册 - Little Eleven' });

const { register, isLoggedIn } = useAuth();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const submitting = ref(false);

if (isLoggedIn.value) {
  navigateTo('/');
}

async function handleSubmit() {
  if (!username.value || !password.value) {
    showToast({ type: 'fail', message: '请输入用户名和密码' });
    return;
  }
  if (password.value !== confirmPassword.value) {
    showToast({ type: 'fail', message: '两次密码不一致' });
    return;
  }
  if (password.value.length < 6) {
    showToast({ type: 'fail', message: '密码至少6位' });
    return;
  }
  submitting.value = true;
  try {
    await register(username.value, password.value);
    showToast({ type: 'success', message: '注册成功' });
    navigateTo('/');
  } catch (e: any) {
    showToast({ type: 'fail', message: e.message || '注册失败' });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6" style="background: var(--app-bg)">
    <div class="w-full max-w-sm">
      <h1 class="text-center text-3xl font-bold text-brand mb-2 tracking-tight">
        Little Eleven
      </h1>
      <p class="text-center mb-8" style="color: var(--app-ink-3)">
        创建你的账号
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
            placeholder="至少6位密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
          <van-field
            v-model="confirmPassword"
            name="confirmPassword"
            label="确认密码"
            type="password"
            placeholder="再次输入密码"
            :rules="[{ required: true, message: '请确认密码' }]"
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
            注册
          </van-button>
        </div>
      </van-form>

      <p class="text-center mt-6" style="color: var(--app-ink-3)">
        已有账号？
        <NuxtLink to="/login" class="text-brand active:opacity-70">
          去登录
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
