import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

// @ts-expect-error works fine in script
import exercises from './exercises_rows.json'

const API_KEY = process.env.ELEVENLABS_API_KEY ?? '<your-api-key>'
const MODEL_ID = 'eleven_multilingual_v2'
const OUTPUT_DIR = './audio'

console.log(API_KEY.slice(0,8))

const VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
]

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

class FatalApiError extends Error {}

async function generateForVoice(voiceId: string, voiceName: string) {
  const voiceDir = `${OUTPUT_DIR}/${voiceName}`
  if (!existsSync(voiceDir)) mkdirSync(voiceDir, { recursive: true })

  const done = exercises.filter(({ exercise_id }: { exercise_id: number }) =>
    existsSync(`${voiceDir}/${exercise_id}.mp3`),
  ).length
  console.log(`\n🎙️  Voice: ${voiceName} — ${done}/${exercises.length} done, ${exercises.length - done} remaining`)

  for (const exercise of exercises) {
    const { exercise_id, name } = exercise
    const outputPath = `${voiceDir}/${exercise_id}.mp3`

    if (existsSync(outputPath)) {
      continue
    }

    console.log(`  🔊 Generating ${exercise_id}.mp3 – "${name}" ...`)
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Next exercise: ${name}`,
          model_id: MODEL_ID,
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.85,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      })

      if (res.status === 401 || res.status === 403) {
        throw new FatalApiError(`Authentication failed (HTTP ${res.status}): ${await res.text()}`)
      }
      if (res.status === 402) {
        throw new FatalApiError(`Quota exhausted (HTTP 402) — re-run once you have more credits`)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)

      // @ts-expect-error works fine in script
      await pipeline(Readable.fromWeb(res.body!), createWriteStream(outputPath))
      console.log(`    ✅ Saved to ${outputPath}`)
    } catch (e) {
      if (e instanceof FatalApiError) throw e
      console.error(`    ❌ Error for ${exercise_id}:`, e)
    }

    await sleep(300)
  }
}

async function generateAll() {
  try {
    for (const voice of VOICES) {
      await generateForVoice(voice.id, voice.name)
    }
    console.log('\n✅ All done!')
  } catch (e) {
    if (e instanceof FatalApiError) {
      console.error(`\n❌ ${e.message}. Progress saved — just re-run the script to continue.`)
      process.exit(1)
    }
    throw e
  }
}

generateAll()
