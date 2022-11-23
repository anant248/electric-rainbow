from tkinter import * # import all tkinter definitions
import random

def changeColor():
    inputValue = int(entry.get())
    
    # r = random.randint(0,inputValue)
    # g = random.randint(0,inputValue)
    # b = random.randint(0,inputValue)
    # rgb = [r,g,b]
    # print('A Random color is :',rgb)

    if (inputValue <= 50):
        canvas.configure(bg="yellow")
    else:
        canvas.configure(bg="blue")

window = Tk() # create a root window
window.geometry("400x400")

# create a label
label = Label(window, text = "Electric Rainbow 🎸🎶", bg = "pink", fg = "yellow", pady=20, padx=20) 
label.pack() # place the label in the window

# Create an entry
entry = Entry(window, width=20)
entry.insert(0, "")
entry.pack() # place entry in window

# Create a button
button = Button(window, text = "Enter", command=changeColor) 
button.pack() # place the button in the window

canvas = Canvas(window, width=200, height=200, bg="red")
canvas.pack()

# canvas.create_rectangle(10, 10, 100, 100, fill="white")


window.mainloop() # create an event loop
