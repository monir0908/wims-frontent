import {
  Component,
  TemplateRef,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  OnInit,
} from "@angular/core";
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { ColumnMode } from "@swimlane/ngx-datatable";
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from "@angular/forms";
import { Router } from "@angular/router";
import { CommonService } from "./../_services/common.service";
import { ToastrService } from "ngx-toastr";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Page } from "./../_models/page";
import { SubscriptionStatus } from "./../_models/enums";
import { ConfirmService } from '../_helpers/confirm-dialog/confirm.service';

@Component({
  selector: "app-cancel-entire-sub-next-month",
  templateUrl: "./cancel-entire-sub-next-month.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class CancelEntireSubNextMonthComponent implements OnInit {
  entryForm: FormGroup;
  itemHistoryList: FormArray;
  itemFormArray: any;
  SubscriptionStatus = SubscriptionStatus;
  fromRowData:any;

  subTotal:number =0;
  discount:number=0;
  paidAmount:number=0;

  submitted = false;
  @BlockUI() blockUI: NgBlockUI;
  modalTitle = "Add ";
  btnSaveText = "Cancel Entire Subscription From Next Month";

  modalConfig: any = { class: "gray modal-lg", backdrop: "static" };
  modalRef: BsModalRef;

  page = new Page();
  rows = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;
  scrollBarHorizontal = window.innerWidth < 1200;
  bsConfig: Partial<BsDatepickerConfig>;

  customerList: Array<any> = [];
  itemList: Array<any> = [];
  subscriptionList: Array<any> = [];
  subscriptionItemList: Array<any> = [];
  simList: Array<any> = [];
  planList: Array<any> = [];

  constructor(
    private confirmService: ConfirmService,
    private modalService: BsModalService,
    public formBuilder: FormBuilder,
    private _service: CommonService,
    private toastr: ToastrService,
    private router: Router
  ) {
    // this.page.pageNumber = 0;
    // this.page.size = 10;
    window.onresize = () => {
      this.scrollBarHorizontal = window.innerWidth < 1200;
    };
    this.bsConfig = Object.assign(
      {},
      {
        dateInputFormat: "DD-MMM-YYYY ",
      }
    );
  }

  ngOnInit() {
    this.entryForm = this.formBuilder.group({
      id: [null],
      customer: [null, [Validators.required]],
      subscription: [null, [Validators.required]],
      itemHistory: this.formBuilder.array([]),
    });
    this.itemHistoryList = this.entryForm.get("itemHistory") as FormArray;
    this.itemFormArray = this.entryForm.get("itemHistory")["controls"];

    this.getCustomerList();
    this.getSIMList();
    this.getPlanList();
  }

  get f() {
    return this.entryForm.controls;
  }

  get item_his(): FormArray {
    return this.entryForm.get("itemHistory") as FormArray;
  }

  customSearchFn(term: string, item: any) {
    term = term.toLocaleLowerCase();
    let name = item.first_name +" "+item.last_name;
    return item.customer_code.toLocaleLowerCase().indexOf(term) > -1 ||
           name.toLocaleLowerCase().indexOf(term) > -1 ||
           item.first_name.toLocaleLowerCase().indexOf(term) > -1 ||
           item.last_name.toLocaleLowerCase().indexOf(term) > -1 ||
           item.mobile.toLocaleLowerCase().indexOf(term) > -1;
    }


  onCustomerChange(e){
    this.entryForm.controls['subscription'].setValue(null);
    let itemHistoryControl = <FormArray>(
      this.entryForm.controls.itemHistory
    );
    while (this.itemHistoryList.length !== 0) {
      itemHistoryControl.removeAt(0);
    }
    if(e){
      this.getItemList(e.id);
    }
  }

  onSubscriptionChange(e){
    if(e){
      this.simList = [];
      this.planList = [];
       this._service.get('subscription/get-subscription-detail/'+e.id).subscribe(res => {

         res.forEach(element => {
           this.simList.push({
             CID_no: element.sim.CID_no,
             ICCID_no: element.sim.ICCID_no,
             id: element.sim.id,
             phone_number: element.sim.phone_number
           });
           this.planList.push({
             id: element.plan.id,
             plan: element.plan.plan
           });
         });

       if(res.length > 0){
         this.subscriptionItemList = res;
         if (this.subscriptionItemList.length > 0) {
          let itemHistoryControl = <FormArray>(
            this.entryForm.controls.itemHistory
          );
          while (this.itemHistoryList.length !== 0) {
            itemHistoryControl.removeAt(0);
          }
          this.subscriptionItemList.forEach(element => {
            // this.getObjFromArray(this.degreeDropDownList,element.DegreeId);
            itemHistoryControl.push(
              this.formBuilder.group({
                id: new FormControl({value:element.id, disabled: true}, Validators.required),
                sim: new FormControl({value:{id:element.sim.id,CID_no:element.sim.CID_no,ICCID_no:element.sim.ICCID_no,phone_number:element.sim.phone_number}, disabled: true}, Validators.required),
                plan: new FormControl({value:{id:element.plan.id,plan:element.plan.plan}, disabled: true}, Validators.required),
                amount: new FormControl({value:element.plan.plan_unit_price, disabled: true}, Validators.required)
              })
            );
          });
        }
       }
     }, err => { });

     }
   }

  getItemList(customerId) {
    this._service.get("subscription/get-active-subscription-list?customer="+customerId).subscribe(
      (res) => {
      //  this.itemList = res;

        this.subscriptionList = res.results;
        // const key = 'subscription';
        // this.subscriptionList = [...new Map(this.itemList.map(item =>
        //   [item[key], item])).values()];
      },
      (err) => {}
    );
  }

  // initItemHistory() {
  //   return this.formBuilder.group({
  //     id:[null],
  //     sim: [null, [Validators.required]],
  //     sim_iccid: [null, [Validators.required]],
  //     plan: [null, [Validators.required]],
  //     amount: [null, [Validators.required]],
  //     refund_amount: [null],
  //     is_removed: [null]
  //   });
  // }

  // addItemHistory() {
  //   this.itemHistoryList.push(this.initItemHistory());
  // }

  // removeItemHistory(i) {
  //   if (this.itemHistoryList.length > 1) {
  //     this.itemHistoryList.removeAt(i);
  //   }
  // }

  getCustomerList() {
    this._service.get("user-list?is_customer=true").subscribe(
      (res) => {
        this.customerList = res;
      },
      (err) => {}
    );
  }

  getSIMList() {
    this._service.get("stock/get-subscriptable-sim-list").subscribe(
      (res) => {
        this.simList = res;
      },
      (err) => {}
    );
  }

  getPlanList() {
    this._service.get("subscription/get-data-plan-list").subscribe(
      (res) => {
        this.planList = res.results;
      },
      (err) => {}
    );
  }

  onSIMChange(e, item) {
    if (e.ICCID_no){
       item.controls["sim_iccid"].setValue(e.ICCID_no);
       item.controls["sim_iccid"].disable();
      }else {
        item.controls["sim_iccid"].setValue(null);
        item.controls["sim_iccid"].enable();
      }
  }

  // onChangeDiscount(value) {
  //   if (parseFloat(value) > this.subTotal) {
  //     this.discount = this.subTotal;
  //   }
  // }

  // onChangePaid(value) {
  //   if (parseFloat(value) > this.subTotal - this.discount) {
  //     this.paidAmount = this.subTotal - this.discount;
  //   }
  // }

  onFormSubmit() {
    this.submitted = true;
    if (this.entryForm.invalid) {
      return;
    }
    let subscribed_relocation_items = [];
    this.blockUI.start('Saving...');
    this.fromRowData = this.entryForm.getRawValue();
    this.fromRowData.itemHistory.forEach(element => {
      subscribed_relocation_items.push({
        customer:this.entryForm.value.customer,
        subscription:this.entryForm.value.subscription,
        sim: element.sim.id,
        plan: element.plan.id
      });

    });


    const obj = {
      customer:this.entryForm.value.customer,
      subscription:this.entryForm.value.subscription,
      subscribed_relocation_items:subscribed_relocation_items
    };


    this.confirmService.confirm('Are you sure?', 'You are canceling the entire subscription from next month .')
    .subscribe(
        result => {
            if (result) {
              this._service.post('subscription/cancel-entire-subscription-from-next-month', obj).subscribe(
                data => {
                  this.blockUI.stop();
                  if (data.IsReport == "Success") {
                    this.toastr.success(data.Msg, 'Success!', { closeButton: true, disableTimeOut: true });
                    this.formReset();

                  } else if (data.IsReport == "Warning") {
                    this.toastr.warning(data.Msg, 'Warning!', { closeButton: true, disableTimeOut: true });
                  } else {
                    this.toastr.error(data.Msg, 'Error!',  { closeButton: true, disableTimeOut: true });
                  }
                },
                err => {
                  this.blockUI.stop();
                  this.toastr.error(err.Msg || err, 'Error!', { timeOut: 2000 });
                }
              );
            }
            else{
                this.blockUI.stop();
            }
        },

    );

  }



  // itemTotal(){
  //   this.fromRowData = this.entryForm.getRawValue();
  //   if(this.fromRowData.itemHistory.length > 0){
  //     this.subTotal = this.fromRowData.itemHistory.map(x => Number(x.amount)).reduce((a, b) => a + b);
  //   }
  // }

  formReset(){
    this.submitted = false;
    this.entryForm.reset();
    Object.keys(this.entryForm.controls).forEach(key => {
      this.entryForm.controls[key].setErrors(null)
    });
    let itemHistoryControl = <FormArray>(
      this.entryForm.controls.itemHistory
    );
    while (this.itemHistoryList.length !== 0) {
      itemHistoryControl.removeAt(0);
    }
    this.subTotal=0;
    this.discount=0;
    this.paidAmount=0;

    this.getCustomerList();
    this.getSIMList();
    this.getPlanList();
  }


}
