import matplotlib.pyplot as plt
import numpy as np
import aubio
import pyaudio
import board
import busio
import digitalio
import adafruit_mcp3xxx.mcp3008 as MCP
from adafruit_mcp3xxx.analog_in import AnalogIn
import wave
import struct
import librosa

# # Set up parameters for audio recording
# FORMAT = pyaudio.paInt16
# CHANNELS = 1
# RATE = 44100
# CHUNK = 1024
# RECORD_SECONDS = 10
# WAVE_OUTPUT_FILENAME = "output.wav"

# # Set up PyAudio object
# audio = pyaudio.PyAudio()

# # Open input stream from ADC
# stream = audio.open(format=FORMAT,
#                     channels=CHANNELS,
#                     rate=RATE,
#                     input=True,
#                     input_device_index=0,
#                     frames_per_buffer=CHUNK)

# print("Recording...")




# Initialize SPI bus and MCP3008 object
spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
cs = digitalio.DigitalInOut(board.D22)
mcp = MCP.MCP3008(spi, cs)

# Set up parameters for audio recording
sample_rate = 22050
num_channels = 1
sample_width = 2
num_samples = 22050 * 5  # Record for 10 seconds

# Initialize audio data buffer
audio_data = bytearray()

chan0 = AnalogIn(mcp, MCP.P0)

def recordAudio():

    # Read data from ADC and store in buffer
    for i in range(num_samples):
        # Read analog value from MCP3008 channel 0
        adc_value = chan0.value
        print(adc_value)

        # Convert 16-bit ADC value to signed 16-bit integer
        if adc_value > 32767:
            adc_value -= 65536
        audio_data.extend(struct.pack("<h", adc_value))

    # Create WAV file and write audio data to it
    with wave.open("recording.wav", "wb") as wav_file:
        wav_file.setparams((num_channels, sample_width, sample_rate,
                            num_samples, "NONE", "not compressed"))
        wav_file.writeframes(audio_data)


FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK = 1024

audio = pyaudio.PyAudio()

stream = audio.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)




def analyze_music_file(filename):
    # Load audio file
    y, sr = librosa.load(filename)

    # Compute duration in seconds
    duration = librosa.get_duration(y=y, sr=sr)

    # Compute the chroma feature
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

    # Get pitches and magnitudes
    pitches, magnitudes = librosa.core.piptrack(y=y, sr=sr)

    # Compute the minimum and maximum notes played
    min_note = librosa.midi_to_note(np.argmin(chroma))
    max_note = librosa.midi_to_note(np.argmax(chroma))

    # Convert pitches to note names
    notes = [librosa.midi_to_note(pitch) for pitch in pitches]

    return duration, (min_note, max_note), notes

# Set up parameters for audio recording
FORMAT2 = pyaudio.paFloat32
BUFFER_SIZE = CHUNK // 2

# Open input stream from default microphone
stream2 = audio.open(format=FORMAT2,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

# Set up beat detection object
beat_detector = aubio.tempo("default", BUFFER_SIZE, CHUNK, RATE)

# Set up plot
fig, ax = plt.subplots()
ax.set_ylim([0, 1])
x = np.arange(0, CHUNK // 2)
line, = ax.plot(x, np.zeros(CHUNK // 2))

# Loop over audio stream and detect beats
while True:
    # Read audio data from stream
    data = stream2.read(CHUNK, exception_on_overflow=False)
    samples = np.frombuffer(data, dtype=aubio.float_type)

    # Perform beat detection
    is_beat = beat_detector(samples)

    # Plot beat
    if is_beat:
        line.set_ydata(np.ones(CHUNK // 2))
    else:
        line.set_ydata(np.zeros(CHUNK // 2))
    fig.canvas.draw()
    fig.canvas.flush_events()


# Define the analog input channel to be read
chan = AnalogIn(mcp, MCP.P0)
# Define the number of samples to be taken
num_samples = 1000
#measure the effective sampling rate of the pi's pin


def measureSampleRate(channel, num_samples=1000):
    # Take samples and measure the time it takes to complete the channel
    start_time = time.monotonic()
    for i in range(num_samples):
        value = channel.value
    end_time = time.monotonic()

    # Calculate the sample rate in Hz
    sample_rate = num_samples / (end_time - start_time)

    print(f"Sample rate: {sample_rate:.2f} Hz")

    return sample_rate
