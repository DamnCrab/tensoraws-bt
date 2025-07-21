<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">{{ isLogin ? '用户登录' : '用户注册' }}</h3>
      </template>
      
      <!-- 登录表单 -->
      <UForm 
        v-if="isLogin" 
        :state="loginFormState.formData.value" 
        :errors="loginFormState.errors.value"
        @submit="handleLogin" 
        class="space-y-4"
      >
        <UFormField label="用户名或邮箱" name="username" required>
          <UInput 
            :model-value="loginFormState.formData.value.username"
            @update:model-value="(value) => loginFormState.updateField('username', value)"
            placeholder="请输入用户名或邮箱" 
          />
        </UFormField>
        
        <UFormField label="密码" name="password" required>
          <UInput 
            :model-value="loginFormState.formData.value.password"
            @update:model-value="(value) => loginFormState.updateField('password', value)"
            type="password" 
            placeholder="请输入密码" 
          />
        </UFormField>
        
        <div class="flex justify-between items-center">
          <UButton @click="isLogin = false" variant="ghost" size="sm">
            没有账户？立即注册
          </UButton>
          <div class="flex gap-2">
            <UButton @click="close" variant="outline">取消</UButton>
            <UButton 
              type="submit" 
              :loading="loginFormState.isSubmitting.value"
              :disabled="!loginFormState.isValid.value"
            >
              登录
            </UButton>
          </div>
        </div>
      </UForm>

      <!-- 注册表单 -->
      <UForm 
        v-else 
        :state="registerFormState.formData.value" 
        :errors="registerFormState.errors.value"
        @submit="handleRegister" 
        class="space-y-4"
      >
        <UFormField label="用户名" name="username" required>
          <UInput 
            :model-value="registerFormState.formData.value.username"
            @update:model-value="(value) => registerFormState.updateField('username', value)"
            placeholder="请输入用户名" 
          />
        </UFormField>
        
        <UFormField label="邮箱" name="email" required>
          <UInput 
            :model-value="registerFormState.formData.value.email"
            @update:model-value="(value) => registerFormState.updateField('email', value)"
            type="email" 
            placeholder="请输入邮箱" 
          />
        </UFormField>
        
        <UFormField label="密码" name="password" required>
          <UInput 
            :model-value="registerFormState.formData.value.password"
            @update:model-value="(value) => registerFormState.updateField('password', value)"
            type="password" 
            placeholder="请输入密码" 
          />
        </UFormField>
        
        <UFormField label="确认密码" name="confirmPassword" required>
          <UInput 
            :model-value="registerFormState.formData.value.confirmPassword"
            @update:model-value="(value) => registerFormState.updateField('confirmPassword', value)"
            type="password" 
            placeholder="请再次输入密码" 
          />
        </UFormField>
        
        <div class="flex justify-between items-center">
          <UButton @click="isLogin = true" variant="ghost" size="sm">
            已有账户？立即登录
          </UButton>
          <div class="flex gap-2">
            <UButton @click="close" variant="outline">取消</UButton>
            <UButton 
              type="submit" 
              :loading="registerFormState.isSubmitting.value"
              :disabled="!registerFormState.isValid.value"
            >
              注册
            </UButton>
          </div>
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { User } from '~/types'

interface Props {
  modelValue: boolean
  defaultMode?: 'login' | 'register'
}

interface Emits {
  'update:modelValue': [value: boolean]
  'success': [user: User]
}

const props = withDefaults(defineProps<Props>(), {
  defaultMode: 'login'
})

const emit = defineEmits<Emits>()

// 使用 composables
const { login, register } = useAuth()
const { schemas } = useValidation()

// 响应式数据
const isLogin = ref(props.defaultMode === 'login')

// 表单状态管理
const loginFormState = useFormState(schemas.login, {
  username: '',
  password: ''
})

const registerFormState = useFormState(schemas.register, {
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 计算属性
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
function close() {
  isOpen.value = false
  resetForms()
}

function resetForms() {
  loginFormState.reset()
  registerFormState.reset()
  isLogin.value = props.defaultMode === 'login'
}

async function handleLogin() {
  // 校验表单
  const validation = loginFormState.validate()
  if (!validation.isValid) {
    useToast().add({
      title: '表单校验失败',
      description: '请检查输入的信息',
      color: 'error'
    })
    return
  }

  loginFormState.setSubmitting(true)
  try {
    const response = await login(validation.data!)
    if (response.success && response.data) {
      emit('success', response.data)
      close()
      
      useToast().add({
        title: '登录成功',
        description: '欢迎回来！',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('登录失败:', error)
    useToast().add({
      title: '登录失败',
      description: '用户名或密码错误',
      color: 'error'
    })
  } finally {
    loginFormState.setSubmitting(false)
  }
}

async function handleRegister() {
  // 校验表单
  const validation = registerFormState.validate()
  if (!validation.isValid) {
    useToast().add({
      title: '表单校验失败',
      description: '请检查输入的信息',
      color: 'error'
    })
    return
  }

  registerFormState.setSubmitting(true)
  try {
    const response = await register({
      username: validation.data!.username,
      email: validation.data!.email,
      password: validation.data!.password
    })
    
    if (response.success && response.data) {
      emit('success', response.data)
      close()
      
      useToast().add({
        title: '注册成功',
        description: '欢迎加入 AnimeBT！',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('注册失败:', error)
    useToast().add({
      title: '注册失败',
      description: '注册时发生错误，请稍后重试',
      color: 'error'
    })
  } finally {
    registerFormState.setSubmitting(false)
  }
}

// 监听模态框关闭
watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForms()
  }
})
</script>