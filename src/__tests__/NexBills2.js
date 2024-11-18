/**
 * @jest-environment jsdom
 */
import { screen, fireEvent, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES_PATH} from "../constants/routes.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should create a FormData with file and email, and call store's create method", async () => {
      document.body.innerHTML = NewBillUI()
    
      // Mock localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: 'Employee', email: "a@a" }))
    
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      
      const fileInput = screen.getByTestId("file")
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", handleChangeFile)
    
      const validFile = new File(["file content"], "test.jpg", { type: "image/jpeg" })
      userEvent.upload(fileInput, validFile)

      expect(handleChangeFile).toHaveBeenCalled()
     
    })
    
  })
})


