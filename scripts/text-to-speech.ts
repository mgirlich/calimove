import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

// @ts-expect-error works fine in script
import exercises from './exercises_rows.json'

const API_KEY = process.env.ELEVENLABS_API_KEY ?? '<your-api-key>'
const MODEL_ID = 'eleven_multilingual_v2'
const OUTPUT_DIR = './audio'

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

async function generateForVoice(voiceId: string, voiceName: string) {
  const voiceDir = `${OUTPUT_DIR}/${voiceName}`
  if (!existsSync(voiceDir)) mkdirSync(voiceDir, { recursive: true })

  for (const exercise of exercises) {
    const { exercise_id, name } = exercise
    const outputPath = `${voiceDir}/${exercise_id}.mp3`

    if (existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${exercise_id} (${name}) – already exists`)
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

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)

      // @ts-expect-error works fine in script
      await pipeline(Readable.fromWeb(res.body!), createWriteStream(outputPath))
      console.log(`    ✅ Saved to ${outputPath}`)
    } catch (e) {
      console.error(`    ❌ Error for ${exercise_id}:`, e)
    }

    await sleep(300)
  }
}

async function generateAll() {
  for (const voice of VOICES) {
    console.log(`\n🎙️  Voice: ${voice.name}`)
    await generateForVoice(voice.id, voice.name)
  }
  console.log('\n✅ All done!')
}

generateAll()
