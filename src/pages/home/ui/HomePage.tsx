import Link from 'next/link'
import { Button } from '@/shared/ui'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { CheckCircle2, Zap, Shield, Users, Sparkles, ArrowRight } from 'lucide-react'

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img src="/images/logo.png" alt="intask" width={120} height={120} className="h-20 w-auto sm:h-28" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              Управление задачами
              <br />
              <span className="text-primary">нового уровня</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
              Современная платформа для управления задачами и проектами.
              <br className="hidden sm:block" />
              Простота, эффективность, результат.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-base px-8 py-6 h-auto">
                  Начать работу
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto">
                  Войти
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl mb-4">
              Почему выбирают intask
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Все необходимое для эффективной работы с задачами в одном месте
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Молниеносная скорость</CardTitle>
                <CardDescription>
                  Мгновенный отклик интерфейса и быстрая синхронизация данных для максимальной продуктивности
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Безопасность данных</CardTitle>
                <CardDescription>
                  Ваши задачи и проекты защищены современными стандартами шифрования и резервного копирования
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Командная работа</CardTitle>
                <CardDescription>
                  Эффективная совместная работа над проектами с прозрачным распределением задач и отслеживанием
                  прогресса
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Умная автоматизация</CardTitle>
                <CardDescription>
                  Интеллектуальные алгоритмы помогают оптимизировать рабочие процессы и сократить рутинные операции
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Интуитивный интерфейс</CardTitle>
                <CardDescription>
                  Простой и понятный дизайн, который не требует обучения. Начните работать сразу после регистрации
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Кроссплатформенность</CardTitle>
                <CardDescription>
                  Работайте на любом устройстве — десктоп, планшет или смартфон. Ваши данные всегда синхронизированы
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl mb-4">Готовы начать?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам пользователей, которые уже повысили свою продуктивность с intask
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-base px-8 py-6 h-auto">
              Создать аккаунт
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="intask" width={32} height={32} className="h-6 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} intask. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { HomePage }
