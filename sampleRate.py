import time
import board
import busio
import digitalio
import adafruit_mcp3xxx.mcp3008 as MCP
from adafruit_mcp3xxx.analog_in import AnalogIn







# Initialize SPI bus and MCP3008 object
spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
cs = digitalio.DigitalInOut(board.D22)
mcp = MCP.MCP3008(spi, cs)

# Define the analog input channel to be read
chan = AnalogIn(mcp, MCP.P0)

# Define the number of samples to be taken
num_samples = 1000

# Take samples and measure the time it takes to complete
start_time = time.monotonic()
for i in range(num_samples):
    value = chan.value
end_time = time.monotonic()

# Calculate the sample rate in Hz
sample_rate = num_samples / (end_time - start_time)

print(f"Sample rate: {sample_rate:.2f} Hz")
