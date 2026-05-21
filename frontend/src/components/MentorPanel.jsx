import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2, UserIcon, Clock, Check } from "lucide-react"

export default function MentorPanel({ profileData, isProfileEditing, handleProfileChange, handleMentorNameSubmit, mentorTickets, activeAnswerTexts, setActiveAnswerTexts, handleSendAnswer, handleLogout }) {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-2xl font-bold text-[#315b8c]">Панель наставника</CardTitle>
        </div>
        <Button variant="outline" onClick={handleLogout}>Выйти</Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-8 p-5 border border-slate-200 rounded-xl bg-slate-50 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Ваши контактные данные</h3>
          {!isProfileEditing && profileData.full_name ? (
            <div className="relative group cursor-help bg-white border border-slate-200 p-3 rounded-lg text-slate-700 font-medium flex items-center gap-2 shadow-sm w-full md:w-1/2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {profileData.full_name}
              <div className="absolute left-0 -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-30">Для изменения ФИО обратитесь к администратору</div>
            </div>
          ) : (
            <form onSubmit={handleMentorNameSubmit} className="flex flex-col md:flex-row gap-3 w-full md:w-2/3">
              <Input name="full_name" value={profileData.full_name} onChange={handleProfileChange} placeholder="Введите ваше полное ФИО..." className="flex-1 bg-white border-slate-300" />
              <Button type="submit" className="bg-[#315b8c] text-white hover:bg-[#264871]">Сохранить данные</Button>
            </form>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Запросы от соискателей</h3>
        {mentorTickets.length === 0 ? ( <div className="text-center py-10 text-slate-500">Пока нет вопросов от подопечных.</div> ) : (
          <div className="space-y-6">
            {mentorTickets.map(t => (
              <div key={t.id} className="border-2 rounded-xl p-4 bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><UserIcon className="w-4 h-4 text-slate-400" />{t.author_name} <span className="text-xs font-normal text-slate-400 ml-2">(Запрос #{t.id})</span></span>
                  {t.status === 'pending' ? ( <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Требует ответа</span> ) : ( <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Закрыт</span> )}
                </div>
                <div className="text-sm bg-slate-50 p-3 rounded-lg border text-slate-800"><strong>Вопрос:</strong> {t.question}</div>
                {t.status === 'pending' ? (
                  <div className="space-y-2">
                    <textarea rows="2" placeholder="Напишите ответ..." value={activeAnswerTexts[t.id] || ""} onChange={(e) => setActiveAnswerTexts(prev => ({ ...prev, [t.id]: e.target.value }))} className="w-full p-2 border rounded-lg text-sm" />
                    <Button onClick={() => handleSendAnswer(t.id)} className="bg-green-600 hover:bg-green-700 text-white"><Check className="w-4 h-4 mr-1" /> Отправить ответ</Button>
                  </div>
                ) : ( <div className="text-sm bg-green-50/50 border border-green-100 p-3 rounded-lg text-slate-700"><strong>Ваш ответ:</strong> {t.answer}</div> )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}