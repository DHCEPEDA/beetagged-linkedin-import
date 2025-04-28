//
//  BaseViewController.m
//  Tag
//
//  Created by Billy Irwin on 12/3/13.
//  Copyright (c) 2013 Arbrr. All rights reserved.
//

#import "BaseViewController.h"

@interface BaseViewController ()

@end

@implementation BaseViewController

- (id)initWithOnFrame:(CGRect)onFrame andOffFrame:(CGRect)offFrame
{
    self = [super init];
    if (self) {
        self.onFrame = onFrame;
        self.offFrame = offFrame;
        self.isOnScreen = false;

        
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(backgroundTouched:)];
    tap.delegate = self;
    [self.view addGestureRecognizer:tap];
	// Do any additional setup after loading the view.
    self.keyboardVisible = false;
    

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self selector:@selector(noticeShowKeyboard:) name:UIKeyboardDidShowNotification object:nil];
    [center addObserver:self selector:@selector(noticeHideKeyboard:) name:UIKeyboardWillHideNotification object:nil];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)backgroundTouched:(id)sender
{
    if (self.keyboardVisible) {
        [self removeAllResponder:self.view];
    }
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch
{
    //NSLog(@"should recognize touch %i %i", self.keyboardVisible, self.isOnScreen);
    //NSLog(@"%@", gestureRecognizer);
    return self.keyboardVisible;
}

- (BOOL)removeAllResponder:(UIView*)v
{
    if ([v isFirstResponder]) {
        [v resignFirstResponder];
        return YES;
    }
    for (UIView *v2 in v.subviews) {
        if ([self removeAllResponder:v2]) {
            return YES;
        }
    }
    return NO;
}

- (void)flashMessage:(NSString *)message isError:(BOOL)err {
}

- (void)moveOffScreen
{
    self.view.frame = self.onFrame;
    self.isOnScreen = false;
    //self.view.alpha = 0;
}

- (void)moveOnScreen
{
    self.view.frame = self.onFrame;
    self.isOnScreen = YES;
    self.view.alpha = 1;
    [self.view.superview bringSubviewToFront:self.view];
}

//- (void)clearTF:(UIView*)v
//{
//    if ([v isKindOfClass:[UITextField class]]) {
//        [(UITextField*)v setText:@""];
//    }
//    
//    for (UIView *v2 in v.subviews) {
//        [self clearTF:v2];
//    }
//}

-(void) noticeShowKeyboard:(NSNotification *)inNotification {
	self.keyboardVisible = true;
}

-(void) noticeHideKeyboard:(NSNotification *)inNotification {
	self.keyboardVisible = false;
}


- (void)startActivity {
    [self.view bringSubviewToFront:self.tagActivity];
    [self.tagActivity start];
//    [UIView animateWithDuration:0.4 animations:^{
//        self.view.dimView.alpha = 1;
//    }];
}

-(NSString*)formatNumber:(NSString*)mobileNumber
{
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@"(" withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@")" withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@" " withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@"-" withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@"+" withString:@""];
    
    int length = [mobileNumber length];
    if(length > 10) {
        mobileNumber = [mobileNumber substringFromIndex: length-10];
    }
    return mobileNumber;
}


-(int)getLength:(NSString*)mobileNumber
{
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@"(" withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@")" withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@" " withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@"-" withString:@""];
    mobileNumber = [mobileNumber stringByReplacingOccurrencesOfString:@"+" withString:@""];
    
    int length = [mobileNumber length];
    return length;
}


- (void)endActivity {
    [UIView animateWithDuration:0.2 animations:^{
//        self.view.dimView.alpha = 0;
    } completion:^(BOOL finished) {
        [self.view sendSubviewToBack:self.tagActivity];
        [self.tagActivity end];
    }];
}


@end
