import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, MessageSquarePlus, Clock, Check, AlertCircle } from "lucide-react"

export default function UserMentor({ isLoggedIn, chosenMentorId, mentorsList, selectedMentorId, setSelectedMentorId, handleChooseMentor, ticketQuestion, setTicketQuestion, handleCreateTicket, myTickets, profileData }) {
  if (!isLoggedIn) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white"><CardContent className="pt-6"><div className="h-[200px] flex items-center justify-center text-center text-slate-500 bg-slate-50 border-2 border-dashed rounded-xl">Для связи с наставником необходимо авторизоваться.</div></CardContent></Card>
    )
  }

  const hasFullName = profileData?.full_name && profileData.full_name.trim() !== "";

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="text-2xl font-bold text-[#315b8c]">Связь с наставником</CardTitle>
        <CardDescription>Задайте индивидуальный вопрос закрепленному за вами куратору.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {!hasFullName ? (
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold text-amber-800 mb-2">Требуется заполнить профиль</h3>
              <p className="text-sm text-amber-700 max-w-md mx-auto leading-relaxed">
                Для выбора наставника и отправки вопросов необходимо указать ваше ФИО в <strong className="font-semibold">Личном кабинете</strong>. Это нужно для того, чтобы наставник знал, кому он отвечает.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
              <label className="text-sm font-semibold text-slate-700 block">Ваш закрепленный наставник:</label>
              {chosenMentorId ? (
                <div className="relative group cursor-help bg-white border p-3 rounded-lg text-slate-700 font-medium flex items-center gap-2 shadow-sm w-fit">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {mentorsList.find(m => m.id === chosenMentorId)?.full_name || "Загрузка..."} (Закреплен)
                  <div className="absolute left-0 -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-30 whitespace-nowrap pointer-events-none">
                    Для смены наставника обратитесь на кафедру
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-3">
                  <select value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)} className="flex-1 h-10 px-3 border rounded-md bg-white focus:outline-none">
                    <option value="">-- Выберите наставника из списка --</option>
                    {mentorsList.map(m => (<option key={m.id} value={m.id}>{m.full_name || m.email}</option>))}
                  </select>
                  <Button onClick={handleChooseMentor} className="bg-[#315b8c] text-white hover:bg-[#264871]">Закрепить</Button>
                </div>
              )}
            </div>

            {chosenMentorId && (
              <form onSubmit={handleCreateTicket} className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 block">Опишите вашу проблему или вопрос:</label>
                <textarea rows="3" value={ticketQuestion} onChange={(e) => setTicketQuestion(e.target.value)} placeholder="Введите ваш вопрос наставнику..." className="w-full p-3 border rounded-xl text-sm" />
                <Button type="submit" className="bg-[#315b8c] text-white hover:bg-[#264871] flex items-center gap-2"><MessageSquarePlus className="w-4 h-4" /> Отправить вопрос</Button>
              </form>
            )}

            {chosenMentorId && (
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-lg text-slate-800">История ваших запросов</h3>
                {myTickets.length === 0 ? ( <p className="text-sm text-slate-500">Вы еще не отправляли вопросов.</p> ) : (
                  <div className="space-y-4">
                    {myTickets.map(t => (
                      <div key={t.id} className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm text-slate-800 font-medium bg-slate-50 p-3 rounded-lg border w-full"><strong>Вопрос:</strong> {t.question}</p>
                          {t.status === 'pending' ? ( <span className="shrink-0 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> В ожидании</span> ) : ( <span className="shrink-0 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Решен</span> )}
                        </div>
                        {t.answer && ( <div className="text-sm bg-green-50/50 border border-green-100 p-3 rounded-lg text-slate-700 pl-4 border-l-4 border-l-green-600"><strong>Ответ наставника:</strong> {t.answer}</div> )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}