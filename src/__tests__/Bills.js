/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import Bills from "../containers/Bills.js"
import { formatDate, formatStatus } from "../app/format.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true)

    })
    
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then clicking on the icon should open a modal with the correct image", async () => {
      // Set up the initial DOM with the elements needed for the test
      document.body.innerHTML = BillsUI({ data: bills }) 
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage })
  
      // Mock the modal function to prevent errors and test the call
      $.fn.modal = jest.fn() 
  
      // Find the icon and call handleClickIconEye to check its behavior
      const eyeIcon = screen.getAllByTestId("icon-eye")[0]
      billsInstance.handleClickIconEye(eyeIcon)
  
      // Check that the $.fn.modal function was called with the "show" argument
      expect($.fn.modal).toHaveBeenCalledWith("show")
  
      // check that the image URL is set correctly in the modal window
      const img = document.querySelector("#modaleFile .modal-body img")
      expect(img).toBeTruthy()
      expect(img.getAttribute("src")).toBe(bills[0].fileUrl)
    })
   
  
    test("Then it should return bills with correctly formatted date and status", async () => {
      // Create an instance of the Bills class with necessary dependencies (mocks for testing).
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: localStorageMock  })
      // Call the getBills() method, which retrieves and formats the list of bills.
      const bills = await billsInstance.getBills()
      // Get the list of bills directly from the mock store for comparison.
      const mockBillsList = await mockStore.bills().list() 
      // Check that the returned bills array is not empty.
      expect(bills.length).toBeGreaterThan(0)
      // Verify that the date of the first bill is correctly formatted using the formatDate function.
      expect(bills[0].date).toBe(formatDate(mockBillsList[0].date))
      // Verify that the status of the first bill is correctly formatted using the formatStatus function.
      expect(bills[0].status).toBe(formatStatus(mockBillsList[0].status))
    
    })
  })
})

  
// test d'intégration GET
describe("Given I am connected as an employee", () => {
  describe("When I navigate to the Bills page", () => {
    test("Then it should fetch bills from the mock API GET and display them correctly", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      // Check if the expected accounts are in the table
      const rows = screen.getAllByRole("row")
      expect(rows.length).toBeGreaterThan(1) 
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
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  
  })
})