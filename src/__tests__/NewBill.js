/**
 * @jest-environment jsdom
 */


import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { ROUTES_PATH} from "../constants/routes.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    test("Then it should display an alert and clear the file input", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      
      // Mock localStorage and alert
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      window.alert = jest.fn()

      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      
      const fileInput = screen.getByTestId("file")
      fileInput.addEventListener("change", handleChangeFile)

      // Uploading a file with an incorrect extension
      const invalidFile = new File(["test"], "test.pdf", { type: "application/pdf" })
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers jpg, jpeg ou png sont acceptés.")
      expect(fileInput.value).toBe("") // Check if the value is reset
    })

    test("Then handleSubmit should collect data, call updateBill, and navigate to Bills", () => {
      // Set the initial state of the DOM
      document.body.innerHTML = NewBillUI()
      
      // Mock localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: 'Employee', email: "a@a" }))

      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Mock the updateBill function
      const updateBill = jest.fn()
      newBill.updateBill = updateBill

      // Fill in the form data
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Test Expense"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("datepicker").value = "2023-10-31"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "10"
      screen.getByTestId("commentary").value = "Test Commentary"
      newBill.fileUrl = "test-file-url"
      newBill.fileName = "test-file.jpg"

      // Form Submit Event
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      // Checking the handleSubmit call
      expect(handleSubmit).toHaveBeenCalled()

      //Checking that updateBill was called with the correct data
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
        status: "pending",
        email: "a@a"
      })

      // Checking if onNavigate is called with the correct path
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
    })

    test("Then it should create a FormData with file and email, and call store's create method", async () => {
      document.body.innerHTML = NewBillUI()
    
      // Mock localStorage
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: 'Employee', email: "a@a" }))
    
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
    
      const handleChangeFile = jest.fn(newBill.handleChangeFile.bind(newBill))
      const fileInput = screen.getByTestId("file")
    
      // Create a mock for the create method
      mockStore.bills().create = jest.fn().mockResolvedValue({
        fileUrl: "mockedFileUrl",
        key: "mockedKey",
      })
    
      fileInput.addEventListener("change", handleChangeFile)
    
      const validFile = new File(["file content"], "test.jpg", { type: "image/jpeg" })
      fireEvent.change(fileInput, { target: { files: [validFile] } })
    
      expect(handleChangeFile).toHaveBeenCalled()
      
      // Check that mockStore.bills().create was called with the correct parameters
      expect(mockStore.bills().create).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: { noContentType: true },
      })
    
      // Check that billId, fileUrl and fileName are set correctly
      await mockStore.bills().create().then(() => {
        expect(newBill.billId).toBe("mockedKey")
        expect(newBill.fileUrl).toBe("mockedFileUrl")
        expect(newBill.fileName).toBe("test.jpg")
      })
    })
    
  })
})


// test d'intégration POST 
describe("Given I am connected as an employee", () => {
  describe("When I submit a new bill", () => {
    test("Then it should post the new bill to the API and redirect to Bills page", async () => {
      // Set the initial page state and localStorage
      const html = NewBillUI();
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      
      // Mock the navigation function and create an instance of NewBill
      const onNavigate = jest.fn();
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
      
      // Fill the form with data for the new account
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Business trip to London";
      screen.getByTestId("amount").value = "400";
      screen.getByTestId("datepicker").value = "2023-11-01";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "10";
      screen.getByTestId("commentary").value = "Trip for client meeting";
      newBill.fileUrl = "https://example.com/bill.jpg";
      newBill.fileName = "bill.jpg";
      
      // Mock the create method for a POST request
      mockStore.bills().create = jest.fn().mockResolvedValue({
        id: "12345",
        vat: "20",
        fileUrl: "https://example.com/bill.jpg",
        status: "pending",
        type: "Transports",
        commentary: "Trip for client meeting",
        name: "Business trip to London",
        fileName: "bill.jpg",
        date: "2023-11-01",
        amount: 400,
        pct: 10
      });
      
      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      
      // Check that handleSubmit was called
      expect(handleSubmit).toHaveBeenCalled();
      
      // Check that the create method was called with the correct data
      await waitFor(() => expect(mockStore.bills().create).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: { noContentType: true },
      }));
      
      // Check that a redirect to the Bills page has occurred
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });
  });
});