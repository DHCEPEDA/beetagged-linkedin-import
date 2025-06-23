//
//  ContactTransition.m
//  
//
//  Created by Chris O'Neil on 1/3/14.
//
//

#import "ContactTransition.h"

@interface ContactTransition()
@property (nonatomic, strong) id<UIViewControllerContextTransitioning> transitionContext;
@end

@implementation ContactTransition

// custom initialization where we set our default values
-(id)init {
    self = [super init];
    if (self) {
        [self setDefaults];
    }
    return self;
}

- (void)setDefaults {
    self.presentationDuration = 1.0;
    self.dismissalDuration = 1.0;
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext {
    if (self.isPresenting) {
        return self.presentationDuration;
    } else {
        return self.dismissalDuration;
    }
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext {
    self.transitionContext = transitionContext;
    if(self.isPresenting){
        [self presentationAnimation:self.transitionContext];
    } else {
        [self dismissalAnimation:self.transitionContext];
    }
}


- (void)presentationAnimation:(id<UIViewControllerContextTransitioning>)transitionContext {
    UIViewController *fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    UIViewController *toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    CGRect toViewFrame = [transitionContext initialFrameForViewController:toViewController];
    
    // set the toViewController off of the frame
    toViewController.view.frame = CGRectMake(toViewFrame.origin.x, toViewFrame.origin.y - kHeight,toViewFrame.size.width, toViewFrame.size.height);
    [UIView animateWithDuration:.5
                          delay:0.0 options:UIViewAnimationOptionCurveEaseIn
                     animations:^{
                         toViewController.view.frame = toViewFrame;
                     } completion:^(BOOL finished) {
                         NSLog(@"Done animating");
                     }];
}

- (void)dismissalAnimation:(id<UIViewControllerContextTransitioning>)transitionContext {
    
    UIViewController *fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    UIViewController *toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    CGRect fromViewFrame = [transitionContext initialFrameForViewController:fromViewController];
    CGRect toFrame = fromViewController.view.frame = CGRectMake(fromViewFrame.origin.x, fromViewFrame.origin.y - kHeight, fromViewFrame.size.width, fromViewFrame.size.height);
    
    [UIView animateWithDuration:.5
                          delay:0.0 options:UIViewAnimationOptionCurveEaseIn
                     animations:^{
                         toViewController.view.frame = toFrame;
                     } completion:^(BOOL finished) {
                         NSLog(@"Done animating");
                     }];
}




@end
