/**
 * @jest-environment jsdom
 */


import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES_PATH} from "../constants/routes.js"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    describe("File input behavior", () => {
      test("It should display an alert and clear the file input when an invalid file is uploaded", () => {
        document.body.innerHTML = NewBillUI()

        // Mock localStorage and alert
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
        window.alert = jest.fn()

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        })
        const handleChangeFile = jest.fn(newBill.handleChangeFile)

        const fileInput = screen.getByTestId("file")
        fileInput.addEventListener("change", handleChangeFile)

        // Upload invalid file
        const invalidFile = new File(["test"], "test.pdf", { type: "application/pdf" })
        fireEvent.change(fileInput, { target: { files: [invalidFile] } })

        expect(handleChangeFile).toHaveBeenCalled()
        expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers jpg, jpeg ou png sont acceptés.")
        expect(fileInput.value).toBe("") // Check if the input is reset
      })
    })

    describe("Form submission behavior", () => {
      test("It should collect form data and call updateBill", () => {
        document.body.innerHTML = NewBillUI()

        // Mock localStorage
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))

        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Mock updateBill function
        const updateBill = jest.fn()
        newBill.updateBill = updateBill

        // Fill in form data
        screen.getByTestId("expense-type").value = "Transports"
        screen.getByTestId("expense-name").value = "Test Expense"
        screen.getByTestId("amount").value = "100"
        screen.getByTestId("datepicker").value = "2023-10-31"
        screen.getByTestId("vat").value = "20"
        screen.getByTestId("pct").value = "10"
        screen.getByTestId("commentary").value = "Test Commentary"
        newBill.fileUrl = "test-file-url"
        newBill.fileName = "test-file.jpg"

        const form = screen.getByTestId("form-new-bill")
        const handleSubmit = jest.fn(newBill.handleSubmit)
        form.addEventListener("submit", handleSubmit)

        // Submit form
        fireEvent.submit(form)

        // Validate form submission behavior
        expect(handleSubmit).toHaveBeenCalled()
        expect(updateBill).toHaveBeenCalledWith({
          type: "Transports",
          name: "Test Expense",
          amount: 100,
          date: "2023-10-31",
          vat: "20",
          pct: 10,
          commentary: "Test Commentary",
          fileUrl: "test-file-url",
          fileName: "test-file.jpg",
          status: "pending"
        })
      })

      test("It should navigate to Bills page after form submission", () => {
        document.body.innerHTML = NewBillUI()

        // Mock localStorage
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))

        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        // Mock updateBill
        newBill.updateBill = jest.fn()

        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", newBill.handleSubmit)

        // Submit form
        fireEvent.submit(form)

        // Validate navigation
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      })
    })

    describe("API interaction", () => {
      test("It should create FormData with file and email then call store's create method", async () => {
        document.body.innerHTML = NewBillUI()

        // Mock localStorage
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))

        const onNavigate = jest.fn()
        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })

        const handleChangeFile = jest.fn(newBill.handleChangeFile.bind(newBill))
        const fileInput = screen.getByTestId("file")

        // Mock API response
        mockStore.bills().create = jest.fn().mockResolvedValue({
          fileUrl: "mockedFileUrl",
          key: "mockedKey"
        })

        fileInput.addEventListener("change", handleChangeFile)

        // Upload valid file
        const validFile = new File(["file content"], "test.jpg", { type: "image/jpeg" })
        fireEvent.change(fileInput, { target: { files: [validFile] } })

        // Validate file upload and API call
        expect(handleChangeFile).toHaveBeenCalled()
        expect(mockStore.bills().create).toHaveBeenCalledWith({
          data: expect.any(FormData),
          headers: { noContentType: true }
        })

        // Validate newBill properties
        await mockStore.bills().create().then(() => {
          expect(newBill.billId).toBe("mockedKey")
          expect(newBill.fileUrl).toBe("mockedFileUrl")
          expect(newBill.fileName).toBe("test.jpg")
        })
      })
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
  
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => Promise.reject(new Error("Erreur 404"))
            /*list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }*/
          }})
        window.onNavigate(ROUTES_PATH.NewBill)
        // Spy on console.log to track its calls
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
        
        // Simulate the error directly
        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        })

        // Trigger the API call that fails
        await newBill.store.bills().create().catch((error) => {
        console.log(error)
        /*const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()*/
      })
  
      test("fetches messages from an API and fails with 500 message error", async () => {
  
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
  
        window.onNavigate(ROUTES_PATH.NewBill)
        await new Promise(process.nextTick);
        await waitFor(() => expect(screen.getByText(/Erreur 500/)).toBeTruthy());

        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
})
