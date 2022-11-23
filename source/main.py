from tkinter import Label
import RPi.GPIO as GPIO
import time

import gui as gui
from sensor import distance


# GPIO Mode (BOARD / BCM)
GPIO.setmode(GPIO.BCM)

# set GPIO Pins
GPIO_TRIGGER = 18
GPIO_ECHO = 24

# set GPIO direction (IN / OUT)
GPIO.setup(GPIO_TRIGGER, GPIO.OUT)
GPIO.setup(GPIO_ECHO, GPIO.IN)

if __name__ == '__main__':
	Animation_Window = gui.create_animation_window()
	Animation_canvas = gui.create_animation_canvas(Animation_Window)
	global label
	label = Label(Animation_Window, text="Distance", font=('Aerial 18'))
	label.pack()

	
	try:
		while True:
			Animation_Window.update_idletasks()
			Animation_Window.update()
			r_value = 0
			g_value = 0
			b_value = 0
			
			
			
			dist = distance()
			
			label["text"] = dist
			
			if dist < 5:
				#r_value = 255
				hex_value = "Red"
			else:
				#g_value = 255
				hex_value = 'Green'
			
			#hex_value = '#%02x%02x%02x' % (r_value, g_value, b_value)
			Animation_canvas.config(bg=hex_value)
			print("Measured Distance = %.1f cm" % dist)
			
			time.sleep(1)# Reset by pressing CTRL + C	
	except KeyboardInterrupt:
		print("Measurement stopped by User")
		GPIO.cleanup()
