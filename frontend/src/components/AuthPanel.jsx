import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"

export default function AuthPanel({ isLoginMode, setIsLoginMode, email, setEmail, password, setPassword, isAuthLoading, handleAuthSubmit }) {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white max-w-md mx-auto mt-12">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-[#315b8c]">{isLoginMode ? "Вход в систему" : "Регистрация НПР"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <Input type="email" placeholder="Электронная почта" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isAuthLoading} />
          <Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isAuthLoading} />
          <Button type="submit" className="w-full bg-[#315b8c] hover:bg-[#264871] text-white" disabled={isAuthLoading}>
            {isAuthLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : (isLoginMode ? "Войти" : "Зарегистрироваться")}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">
          {isLoginMode ? "Нет аккаунта? " : "Уже зарегистрированы? "}
          <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setPassword("") }} className="text-[#315b8c] font-semibold hover:underline">{isLoginMode ? "Подать заявку" : "Войти"}</button>
        </div>
      </CardContent>
    </Card>
  )
}