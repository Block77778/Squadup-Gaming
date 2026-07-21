'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

const GRADIENT = 'linear-gradient(to right, #8B5CF6, #10B981)'
const GRADIENT_BG = 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(16,185,129,0.10) 100%)'

const SUGGESTIONS = [
  'How do I join a tournament?',
  'Tell me about membership tiers',
  'How do I buy SUG token?',
  'What games do you support?',
]

const RESPONSES: Record<string, string> = {
  tournament: "To join a tournament, head to the Contests page and pick your game. Create a free account first — then register before the bracket fills. New brackets open every Monday! 🏆",
  membership: "We have 4 tiers — Free, Starter ($4.99/mo), Pro ($9.99/mo), and Elite ($19.99/mo). Elite members get 20% off merch, VIP Discord, exclusive NFT drops and more. Check the Membership page! 👑",
  sug: "SUG is our Solana token traded on Raydium. You'll need a Phantom wallet and some SOL. Head to the Crypto Squad page for a full step-by-step guide! 🪙",
  games: "We support Madden 25, Call of Duty, NBA 2K, and FIFA right now — with more coming soon. Each game has its own weekly tournament with prize pools up to $100K! 🎮",
  partner: "Our featured partner is TerryToto.com — gaming, music, NFTs and more. All paid members get exclusive discounts. You can also claim a FREE Totonian Gamer Passport NFT! 🤝",
  merch: "We've got hoodies, jerseys, snapbacks, mouse pads and more on the Merch page. Elite members get 20% off everything! 👕",
  gotw: "Game of the Week features the hottest game in the community with top plays, tournament highlights, and exclusive content. Check the G.O.T.W page! 🔥",
  default: "Hey! I'm your Squad Up concierge. I can help with tournaments, membership, the SUG token, our games, partnerships, or merch. What do you want to know? 🎮",
}

function getResponse(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('tournament') || m.includes('contest') || m.includes('join') || m.includes('compete')) return RESPONSES.tournament
  if (m.includes('member') || m.includes('tier') || m.includes('pro') || m.includes('elite') || m.includes('starter')) return RESPONSES.membership
  if (m.includes('sug') || m.includes('token') || m.includes('crypto') || m.includes('solana') || m.includes('raydium')) return RESPONSES.sug
  if (m.includes('game') || m.includes('madden') || m.includes('cod') || m.includes('fifa') || m.includes('nba') || m.includes('call of duty')) return RESPONSES.games
  if (m.includes('partner') || m.includes('terry') || m.includes('toto') || m.includes('nft') || m.includes('passport')) return RESPONSES.partner
  if (m.includes('merch') || m.includes('hoodie') || m.includes('jersey') || m.includes('shirt') || m.includes('hat')) return RESPONSES.merch
  if (m.includes('gotw') || m.includes('game of the week') || m.includes('g.o.t.w')) return RESPONSES.gotw
  return RESPONSES.default
}

interface Message {
  role: 'user' | 'bot'
  text: string
}

export function Concierge() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hey! I'm your Squad Up concierge. Ask me anything about tournaments, membership, our token, or merch! 🎮" }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000)
    return () => clearTimeout(t)
  }, [])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setInput('')
    setMessages(p => [...p, { role: 'user', text }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 700))
    setTyping(false)
    setMessages(p => [...p, { role: 'bot', text: getResponse(text) }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">

      {/* Chat window */}
      {open && (
        <div
          className="w-80 md:w-96 rounded-2xl border border-white/10 overflow-hidden flex flex-col animate-scale-in"
          style={{
            background: 'rgba(8,13,20,0.97)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(139,92,246,0.2)',
            maxHeight: '520px',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10" style={{ background: GRADIENT_BG }}>
            <div className="relative w-10 h-14 flex-shrink-0">
              <Image
                src="/squad-up-owner-avatar.png"
                alt="Concierge"
                fill
                className="object-contain object-bottom"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.5))' }}
              />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Squad Up Concierge</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-mono">Online</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-white/40 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '300px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                {msg.role === 'bot' && (
                  <div className="relative w-7 h-10 flex-shrink-0">
                    <Image src="/squad-up-owner-avatar.png" alt="" fill className="object-contain object-bottom" />
                  </div>
                )}
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: GRADIENT, color: '#fff', borderBottomRightRadius: '4px' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: '4px' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex items-end gap-2">
                <div className="relative w-7 h-10 flex-shrink-0">
                  <Image src="/squad-up-owner-avatar.png" alt="" fill className="object-contain object-bottom" />
                </div>
                <div className="bg-white/6 border border-white/8 rounded-2xl px-4 py-3 flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions — only show at start */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-all font-mono"
                  style={{ background: 'rgba(139,92,246,0.08)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-500/60 transition-all"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
              style={{ background: GRADIENT }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Avatar trigger */}
      <div className="relative flex items-end gap-2">
        {/* Hint speech bubble */}
        {showHint && !open && (
          <div
            className="absolute right-20 bottom-4 bg-white text-gray-900 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xl border-2 border-violet-500 whitespace-nowrap animate-fade-in"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.4))' }}
          >
            Need help? Ask me! 👋
            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-0 h-0"
              style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '10px solid #8B5CF6' }} />
            <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0"
              style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '9px solid white' }} />
          </div>
        )}

        {/* Avatar button */}
        <button
          onClick={() => { setOpen(o => !o); setShowHint(false) }}
          className="relative w-16 h-24 hover:scale-105 transition-transform duration-300 cursor-pointer"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(139,92,246,0.5))' }}
          aria-label="Open concierge"
        >
          <Image
            src="/squad-up-owner-avatar.png"
            alt="Squad Up Concierge"
            fill
            className="object-contain object-bottom"
          />
          {/* Online indicator */}
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
        </button>
      </div>
    </div>
  )
}
